<template>
  <div class="inspect-users-container">
    <div class="page-header">
      <h1>User Management</h1>
      <p class="subtitle">Browse and inspect all registered users</p>
    </div>

    <!-- Search and Filter Bar -->
    <div class="search-filter-bar">
      <div class="search-input-wrapper">
        <input
          v-model="searchQuery"
          @input="debouncedSearch"
          type="text"
          placeholder="Search by email, nickname, first name, or last name..."
          class="search-input"
        />
        <svg
          class="search-icon"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>

      <div class="filter-group">
        <select v-model="filters.verified" @change="applyFilters" class="filter-select">
          <option value="">All Verification Status</option>
          <option value="true">Verified</option>
          <option value="false">Not Verified</option>
        </select>

        <select v-model="filters.blocked" @change="applyFilters" class="filter-select">
          <option value="">All Block Status</option>
          <option value="false">Active</option>
          <option value="true">Blocked</option>
        </select>

        <select v-model="filters.userType" @change="applyFilters" class="filter-select">
          <option value="all">All User Types</option>
          <option value="individual">Individual</option>
          <option value="company">Company</option>
          <option value="admin">Admin</option>
        </select>
      </div>
    </div>

    <!-- Results Info -->
    <div v-if="!loading && users.length > 0" class="results-info">
      Showing {{ users.length }} of {{ pagination.totalUsers }} users
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading users...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchUsers" class="retry-button">Try Again</button>
    </div>

    <!-- Empty State -->
    <div v-else-if="users.length === 0" class="empty-container">
      <p>No users found</p>
    </div>

    <!-- Users Table -->
    <div v-else class="table-container">
      <table class="users-table">
        <thead>
          <tr>
            <th @click="sortBy('nickname')" class="sortable">
              Nickname
              <span class="sort-indicator" v-if="sortField === 'nickname'">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th @click="sortBy('email')" class="sortable">
              Email
              <span class="sort-indicator" v-if="sortField === 'email'">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th>Name</th>
            <th>User Type</th>
            <th>Status</th>
            <th @click="sortBy('createdAt')" class="sortable">
              Created Date
              <span class="sort-indicator" v-if="sortField === 'createdAt'">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user._id" class="user-row">
            <td>
              <div class="user-cell">
                <img
                  :src="getUserAvatar(user)"
                  :alt="user.nickname"
                  class="user-avatar"
                />
                <span>{{ user.nickname }}</span>
              </div>
            </td>
            <td>{{ user.email }}</td>
            <td>{{ user.first_name }} {{ user.last_name }}</td>
            <td>
              <span class="type-badge" :class="`type-${user.user_type}`">
                {{ formatUserType(user.user_type) }}
              </span>
            </td>
            <td>
              <div class="status-badges">
                <span
                  v-if="user.admin_flag"
                  class="status-badge admin"
                  title="Administrator"
                >
                  Admin
                </span>
                <span
                  v-if="user.id_verified"
                  class="status-badge verified"
                  title="ID Verified"
                >
                  Verified
                </span>
                <span
                  v-if="user.blocked_flag"
                  class="status-badge blocked"
                  title="Account Blocked"
                >
                  Blocked
                </span>
                <span
                  v-if="!user.id_verified && !user.blocked_flag && !user.admin_flag"
                  class="status-badge pending"
                >
                  Active
                </span>
              </div>
            </td>
            <td>{{ formatDate(user.createdAt) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  @click="viewUserProfile(user._id)"
                  class="view-profile-button"
                  title="View as public profile"
                >
                  View Profile
                </button>
                <button
                  @click="viewUserDetails(user._id)"
                  class="view-details-button"
                  title="View admin details"
                >
                  View Details
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="pagination">
      <button
        @click="changePage(pagination.currentPage - 1)"
        :disabled="pagination.currentPage === 1"
        class="pagination-button"
      >
        Previous
      </button>

      <span class="pagination-info">
        Page {{ pagination.currentPage }} of {{ pagination.totalPages }}
      </span>

      <button
        @click="changePage(pagination.currentPage + 1)"
        :disabled="pagination.currentPage === pagination.totalPages"
        class="pagination-button"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import adminService from '../../services/adminService';
import { getFullImageUrl } from '@/utils/api';

export default {
  name: 'InspectUsers',
  setup() {
    const router = useRouter();
    const users = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const searchQuery = ref('');
    const sortField = ref('createdAt');
    const sortOrder = ref('desc');
    const filters = ref({
      verified: '',
      blocked: '',
      userType: 'all'
    });
    const pagination = ref({
      currentPage: 1,
      totalPages: 1,
      totalUsers: 0,
      limit: 20
    });

    let searchTimeout = null;

    const fetchUsers = async () => {
      try {
        loading.value = true;
        error.value = null;

        const params = {
          search: searchQuery.value,
          sortBy: sortField.value,
          sortOrder: sortOrder.value,
          page: pagination.value.currentPage,
          limit: pagination.value.limit
        };

        // Add filters if set
        if (filters.value.verified) params.verified = filters.value.verified;
        if (filters.value.blocked) params.blocked = filters.value.blocked;
        if (filters.value.userType && filters.value.userType !== 'all') {
          params.userType = filters.value.userType;
        }

        const response = await adminService.getUsers(params);
        users.value = response.users;
        pagination.value = response.pagination;
      } catch (err) {
        console.error('Error fetching users:', err);
        error.value = err.response?.data?.message || 'Failed to fetch users. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const debouncedSearch = () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      searchTimeout = setTimeout(() => {
        pagination.value.currentPage = 1; // Reset to first page on search
        fetchUsers();
      }, 500);
    };

    const sortBy = (field) => {
      if (sortField.value === field) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
      } else {
        sortField.value = field;
        sortOrder.value = 'asc';
      }
      fetchUsers();
    };

    const applyFilters = () => {
      pagination.value.currentPage = 1; // Reset to first page on filter
      fetchUsers();
    };

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.totalPages) {
        pagination.value.currentPage = page;
        fetchUsers();
      }
    };

    const viewUserDetails = (userId) => {
      router.push({ name: 'UserDetail', params: { id: userId } });
    };

    const viewUserProfile = (userId) => {
      router.push({ name: 'UserProfile', params: { identifier: userId } });
    };

    const getUserAvatar = (user) => {
      if (user.profile_photo) {
        return getFullImageUrl(user.profile_photo) || 'https://via.placeholder.com/40';
      }
      return 'https://via.placeholder.com/40';
    };

    const formatUserType = (type) => {
      const types = {
        individual: 'Individual',
        company: 'Company',
        admin: 'Admin'
      };
      return types[type] || type;
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    onMounted(() => {
      fetchUsers();
    });

    return {
      users,
      loading,
      error,
      searchQuery,
      sortField,
      sortOrder,
      filters,
      pagination,
      fetchUsers,
      debouncedSearch,
      sortBy,
      applyFilters,
      changePage,
      viewUserDetails,
      viewUserProfile,
      getUserAvatar,
      formatUserType,
      formatDate
    };
  }
};
</script>

<style scoped>
.inspect-users-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1rem;
}

.search-filter-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-input-wrapper {
  position: relative;
  flex: 1;
  min-width: 300px;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;
}

.search-input:focus {
  outline: none;
  border-color: #00aaff;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.filter-group {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-select:hover {
  border-color: #00aaff;
}

.filter-select:focus {
  outline: none;
  border-color: #00aaff;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
}

.results-info {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.loading-container,
.error-container,
.empty-container {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00aaff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #00aaff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #0088cc;
}

.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.users-table {
  width: 100%;
  border-collapse: collapse;
}

.users-table thead {
  background: linear-gradient(135deg, #00aaff 0%, #0088cc 100%);
  color: white;
}

.users-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  white-space: nowrap;
}

.users-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.users-table th.sortable:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sort-indicator {
  margin-left: 0.5rem;
  font-size: 0.8rem;
}

.users-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
  transition: background 0.2s;
}

.users-table tbody tr:hover {
  background: #f8f9fa;
}

.users-table td {
  padding: 1rem;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

.type-badge.type-individual {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.type-company {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.type-admin {
  background: #fff3e0;
  color: #e65100;
}

.status-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.verified {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.blocked {
  background: #ffebee;
  color: #c62828;
}

.status-badge.admin {
  background: #fff3e0;
  color: #f57c00;
}

.status-badge.pending {
  background: #f5f5f5;
  color: #616161;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.view-profile-button {
  padding: 0.5rem 1rem;
  background: white;
  color: #00aaff;
  border: 2px solid #00aaff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  white-space: nowrap;
  font-weight: 500;
}

.view-profile-button:hover {
  background: #00aaff;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 170, 255, 0.3);
}

.view-details-button {
  padding: 0.5rem 1rem;
  background: #00aaff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
  white-space: nowrap;
}

.view-details-button:hover {
  background: #0088cc;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 170, 255, 0.3);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination-button {
  padding: 0.75rem 1.5rem;
  background: #00aaff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.pagination-button:hover:not(:disabled) {
  background: #0088cc;
}

.pagination-button:disabled {
  background: #e0e0e0;
  color: #999;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-size: 1rem;
}

@media (max-width: 768px) {
  .inspect-users-container {
    padding: 1rem;
  }

  .search-filter-bar {
    flex-direction: column;
  }

  .search-input-wrapper {
    width: 100%;
    min-width: auto;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    flex: 1;
  }

  .table-container {
    overflow-x: scroll;
  }

  .users-table {
    min-width: 1000px;
  }
}
</style>
