# Booking Chat Implementation

## Overview
This document describes the booking-specific chat system that allows renters and owners to communicate within the context of a specific booking.

## Key Features
- **Booking-specific messaging**: Messages are tied to a specific booking, separate from general user messages
- **Status-based access control**: Chat availability depends on booking status
- **System messages**: Automatic messages for booking status transitions with timestamps
- **Photo attachments**: Support for image uploads in chat
- **Read-only mode**: Chat history visible but no new messages allowed after booking completion
- **Real-time updates**: Socket.IO integration for instant message delivery

## Architecture

### Backend Components

#### 1. BookingMessage Model (`backend/models/BookingMessage.js`)
- **Fields**:
  - `booking_id`: Reference to the booking
  - `sender_id`: User who sent the message (null for system messages)
  - `message_type`: Enum: `user_message`, `system_status`, `system_info`
  - `content`: Message text
  - `attachment`: Path to attached image
  - `status_reference`: Associated booking status for system messages
  - `is_read`: Message read status
  - `createdAt`: Timestamp

#### 2. Booking Message Routes (`backend/routes/bookingMessageRoutes.js`)
- **GET `/api/bookings/:bookingId/chat/messages`**: Fetch all messages for a booking
- **POST `/api/bookings/:bookingId/chat/send`**: Send a new message (with optional photo attachment)
- **GET `/api/bookings/:bookingId/chat/status`**: Get chat status (enabled/disabled/read-only)

#### 3. System Message Integration (`backend/utils/bookingStateManager.js`)
- `createSystemMessage()`: Creates system messages on status transitions
- Automatically called when booking status changes
- Messages include timestamps and status information

#### 4. Socket.IO Events (`backend/index.js`)
- `booking:join`: User joins a booking chat room
- `booking:leave`: User leaves a booking chat room
- `booking-message`: Real-time message broadcast to room participants

### Frontend Components

#### 1. BookingChat Component (`frontend/src/components/BookingChat.vue`)
Features:
- Message list with system and user messages
- Date separators
- Image attachment support
- Image modal for full-size viewing
- Message input with photo upload
- Read-only mode indicator
- Chat status management

#### 2. Socket Service Integration (`frontend/src/services/socketService.js`)
New methods:
- `joinBookingChat(bookingId)`: Join booking chat room
- `leaveBookingChat(bookingId)`: Leave booking chat room
- `onBookingMessage(callback)`: Listen for new booking messages

#### 3. BookingDetails Integration (`frontend/src/pages/BookingDetails.vue`)
- Replaced placeholder with BookingChat component in right column
- Passes booking ID, status, and other user's name as props

## Chat Availability Rules

### Not Available (No chat visible)
- `PENDING`: Before owner accepts
- `DECLINED`: Booking was declined
- `CANCELLED`: Booking was cancelled

### Active Chat (Full functionality)
- `ACCEPTED`: Owner accepted, awaiting payment/pickup
- `PICKUP`: Equipment pickup phase
- `PICKUP_OWNER`: Owner confirmed handoff
- `PICKUP_RENTER`: Renter confirmed handoff
- `IN_PROGRESS`: Active rental period
- `RETURN`: Equipment return phase
- `RETURN_OWNER`: Owner confirmed return
- `RETURN_RENTER`: Renter confirmed return

### Read-Only (History visible, no new messages)
- `COMPLETED`: Booking successfully completed
- `REVIEWED`: Renter submitted review
- `DISPUTED`: Dispute opened
- `DISPUTE_RESOLVED`: Dispute resolved by admin

## System Messages

System messages are automatically created for the following status transitions:
- Booking accepted
- Pickup day arrived
- Owner/Renter confirmed handoff
- Rental period started
- Return day arrived
- Owner/Renter confirmed return
- Booking completed
- Review submitted
- Booking cancelled/declined
- Dispute opened/resolved

## Data Flow

### Sending a Message
1. User types message and optionally attaches photo
2. Frontend sends POST to `/api/bookings/:bookingId/chat/send`
3. Backend validates user is part of booking
4. Backend checks booking status allows messaging
5. Backend saves message to database
6. Backend emits Socket.IO event to booking room
7. All connected participants receive message in real-time
8. Frontend updates message list

### Status Change
1. Booking status changes (via action buttons)
2. `changeBookingStatus()` in bookingStateManager is called
3. New BookingStatus record created
4. `createSystemMessage()` automatically called
5. System message saved to BookingMessage collection
6. Socket.IO event emitted (if implementing real-time status updates)
7. Chat displays system message with timestamp

### Loading Chat
1. User navigates to BookingDetails page
2. BookingChat component mounts
3. Fetches chat status from backend
4. If chat visible, fetches all messages
5. Joins Socket.IO room for booking
6. Displays messages with date separators
7. Scrolls to bottom

## Security

- **Authentication**: All routes require JWT token
- **Authorization**: Users must be part of booking (renter or owner)
- **File Upload**: Limited to images, max 10MB
- **Status Validation**: Backend enforces chat availability rules
- **Socket.IO**: Room-based isolation ensures messages only go to participants

## Database Indices

BookingMessage collection has indices on:
- `booking_id + createdAt`: For efficient message retrieval
- `booking_id + sender_id`: For user-specific queries

## File Storage

Chat attachments are stored in:
- Directory: `/uploads/booking_messages/`
- Naming: `message-{timestamp}-{random}.{ext}`

## Future Enhancements

Potential improvements:
- Typing indicators for booking chat
- Message delivery/read receipts
- Push notifications for new messages
- Message search within booking
- File attachment support (PDFs, documents)
- Voice messages
- Message reactions/emojis

## Testing Checklist

- [ ] Send message as renter
- [ ] Send message as owner
- [ ] Send message with photo attachment
- [ ] Verify system messages appear on status changes
- [ ] Check chat disabled in PENDING status
- [ ] Check chat read-only in COMPLETED status
- [ ] Verify Socket.IO real-time updates
- [ ] Test with multiple bookings simultaneously
- [ ] Verify unauthorized users cannot access chat
- [ ] Test image upload limits and validation
- [ ] Check date separators display correctly
- [ ] Verify scroll to bottom on new messages
- [ ] Test message persistence across page refreshes

## API Examples

### Get Chat Messages
```javascript
GET /api/bookings/507f1f77bcf86cd799439011/chat/messages
Authorization: Bearer {token}

Response:
{
  "success": true,
  "messages": [
    {
      "_id": "...",
      "booking_id": "507f1f77bcf86cd799439011",
      "sender_id": {
        "_id": "...",
        "nickname": "john_doe",
        "profile_photo": "/uploads/..."
      },
      "message_type": "user_message",
      "content": "When should I pick up the equipment?",
      "attachment": null,
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "_id": "...",
      "booking_id": "507f1f77bcf86cd799439011",
      "sender_id": null,
      "message_type": "system_status",
      "content": "Booking has been accepted by the owner.",
      "status_reference": "ACCEPTED",
      "createdAt": "2025-01-15T09:00:00Z"
    }
  ],
  "booking": {
    "_id": "507f1f77bcf86cd799439011",
    "current_status": "ACCEPTED",
    "renter_id": "...",
    "owner_id": "..."
  }
}
```

### Send Message
```javascript
POST /api/bookings/507f1f77bcf86cd799439011/chat/send
Authorization: Bearer {token}
Content-Type: multipart/form-data

FormData:
  content: "I can pick it up at 3 PM"
  attachment: [File] (optional)

Response:
{
  "success": true,
  "message": {
    "_id": "...",
    "booking_id": "507f1f77bcf86cd799439011",
    "sender_id": {
      "_id": "...",
      "nickname": "jane_smith",
      "profile_photo": "/uploads/..."
    },
    "message_type": "user_message",
    "content": "I can pick it up at 3 PM",
    "attachment": "/uploads/booking_messages/message-1234567890-123456.jpg",
    "createdAt": "2025-01-15T11:00:00Z"
  }
}
```

### Get Chat Status
```javascript
GET /api/bookings/507f1f77bcf86cd799439011/chat/status
Authorization: Bearer {token}

Response:
{
  "success": true,
  "chatStatus": {
    "enabled": true,
    "readOnly": false,
    "visible": true,
    "message": "Chat with jane_smith"
  },
  "bookingStatus": "ACCEPTED"
}
```

## Troubleshooting

### Chat not visible
- Check booking status is ACCEPTED or later
- Verify user is part of the booking (renter or owner)
- Check backend logs for errors

### Messages not sending
- Verify chat is not in read-only mode
- Check file size if uploading attachment
- Ensure booking status allows messaging
- Check network connection

### Real-time updates not working
- Verify Socket.IO connection established
- Check user joined booking room
- Ensure backend Socket.IO server running
- Check browser console for Socket.IO errors

### System messages not appearing
- Verify status transition occurred
- Check `createSystemMessage()` is called in bookingStateManager
- Ensure status is in chatVisibleStates array
- Check BookingMessage collection in database
