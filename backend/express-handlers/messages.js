/**
 * @fileoverview Messages Management API Endpoint
 *
 * Comprehensive API for managing direct messaging in the Musicare platform.
 * Handles chat creation, message sending, and chat history retrieval for
 * therapeutic music sharing and social support between friends.
 *
 * @author Musicare Development Team
 * @version 1.0.0
 * @since 2024-11-21
 * @requires ../lib/prisma.js - Database ORM for message operations
 *
 * @example
 * // Get or create chat between two users
 * GET /api/messages?action=chat&userId=user1&friendId=user2
 *
 * // Get all chats for a user
 * GET /api/messages?action=chats&userId=user1
 *
 * // Send a message
 * POST /api/messages
 * {
 *   "action": "send",
 *   "chatId": "chat-id",
 *   "senderId": "user1",
 *   "text": "Hello!"
 * }
 */

// API endpoint for message operations
import { prisma } from '../lib/prisma.js';

/**
 * GET Request Handler - Retrieve Chat Data
 *
 * Handles various message-related GET operations including fetching chat history,
 * getting or creating chats between users, and retrieving all user chats.
 * Supports different actions via query parameters for flexible message management.
 *
 * @async
 * @function getMessages
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.action - Action type: 'chat' or 'chats'
 * @param {string} req.query.userId - Current user ID
 * @param {string} req.query.friendId - Friend user ID (for 'chat' action)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with chat data
 * @throws {Error} 400 - Missing or invalid parameters
 * @throws {Error} 500 - Database or server errors
 *
 * @example
 * // Get or create chat with a friend
 * GET /api/messages?action=chat&userId=user123&friendId=user456
 *
 * // Response:
 * {
 *   "chat": {
 *     "id": "chat-id",
 *     "participants": [...],
 *     "messages": [...]
 *   }
 * }
 */
async function getMessages(req, res) {
  console.log('💬 Messages API: GET request received');

  const { action, userId, friendId } = req.query;
  console.log(`🔍 Messages API: Action - ${action}, User ID - ${userId ? 'provided' : 'missing'}`);

  /**
   * Input validation for required parameters
   *
   * UserId is required for all message operations to identify
   * the user context for chat relationships.
   */
  if (!userId) {
    console.log('🚨 Messages API: Missing userId parameter');
    return res.status(400).json({
      error: 'userId is required',
      details: 'Provide userId in query parameters to fetch message data',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * Action: Get or create chat with a friend
     *
     * Retrieves existing chat between two users or creates a new one.
     * Returns chat with full message history and participant details.
     */
    if (action === 'chat') {
      console.log('💬 Messages API: Getting/creating chat');

      if (!friendId) {
        console.log('🚨 Messages API: Missing friendId parameter');
        return res.status(400).json({
          error: 'friendId is required for chat action',
          details: 'Provide friendId to get or create a chat',
          timestamp: new Date().toISOString()
        });
      }

      /**
       * Find existing chat between users
       *
       * Chats are bidirectional, so we need to find a chat where BOTH users
       * are participants. We do this by finding chats that have the first user,
       * then filtering to ensure the second user is also a participant.
       */
      console.log(`🔍 Messages API: Looking for existing chat between ${userId} and ${friendId}`);

      let chat = await prisma.chat.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: userId
                }
              }
            },
            {
              participants: {
                some: {
                  userId: friendId
                }
              }
            }
          ]
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  email: true
                }
              }
            }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      /**
       * Create new chat if none exists
       *
       * If no existing chat found, create a new chat and add both users
       * as participants. This ensures every conversation has a dedicated chat.
       */
      if (!chat) {
        console.log('➕ Messages API: No existing chat found, creating new chat');

        chat = await prisma.chat.create({
          data: {
            participants: {
              create: [
                { userId: userId },
                { userId: friendId }
              ]
            }
          },
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    email: true
                  }
                }
              }
            },
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true
                  }
                }
              },
              orderBy: {
                createdAt: 'asc'
              }
            }
          }
        });

        console.log(`✅ Messages API: New chat created - ID: ${chat.id}`);
      } else {
        console.log(`✅ Messages API: Found existing chat - ID: ${chat.id}`);
      }

      return res.status(200).json({
        chat,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Get all chats for a user
     *
     * Retrieves all chats where the user is a participant.
     * Includes last message preview for each chat.
     */
    if (action === 'chats') {
      console.log('💬 Messages API: Fetching all chats for user');

      const chats = await prisma.chat.findMany({
        where: {
          participants: {
            some: {
              userId: userId
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  email: true
                }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: {
              createdAt: 'desc'
            },
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      console.log(`✅ Messages API: Found ${chats.length} chats`);

      return res.status(200).json({
        chats,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Get a specific chat by ID
     *
     * Retrieves a single chat with full message history.
     * Used when opening a chat to get all messages.
     */
    if (action === 'chatById') {
      console.log('💬 Messages API: Fetching chat by ID');

      const { chatId } = req.query;

      if (!chatId) {
        console.log('🚨 Messages API: Missing chatId parameter');
        return res.status(400).json({
          error: 'chatId is required for chatById action',
          details: 'Provide chatId to get a specific chat',
          timestamp: new Date().toISOString()
        });
      }

      const chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  email: true
                }
              }
            }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      if (!chat) {
        console.log(`🚨 Messages API: Chat not found - ${chatId}`);
        return res.status(404).json({
          error: 'Chat not found',
          details: 'The specified chat does not exist',
          timestamp: new Date().toISOString()
        });
      }

      // Verify user is a participant
      const isParticipant = chat.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        console.log(`🚨 Messages API: User ${userId} is not a participant in chat ${chatId}`);
        return res.status(403).json({
          error: 'Access denied',
          details: 'You are not a participant in this chat',
          timestamp: new Date().toISOString()
        });
      }

      console.log(`✅ Messages API: Found chat with ${chat.messages.length} messages`);

      return res.status(200).json({
        chat,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Action: Create a group chat
     *
     * Creates a new group chat with multiple participants.
     * Requires an array of participant user IDs and an optional group name.
     */
    if (action === 'createGroup') {
      console.log('💬 Messages API: Creating group chat');

      const { participantIds, groupName } = req.query;

      if (!participantIds) {
        console.log('🚨 Messages API: Missing participantIds parameter');
        return res.status(400).json({
          error: 'participantIds is required for createGroup action',
          details: 'Provide comma-separated participantIds to create a group chat',
          timestamp: new Date().toISOString()
        });
      }

      // Parse participant IDs (comma-separated string)
      const participantIdArray = participantIds.split(',').map(id => id.trim()).filter(Boolean);

      // Add the current user to participants if not already included
      if (!participantIdArray.includes(userId)) {
        participantIdArray.push(userId);
      }

      if (participantIdArray.length < 2) {
        console.log('🚨 Messages API: Not enough participants for group chat');
        return res.status(400).json({
          error: 'At least 2 participants required',
          details: 'Group chats require at least 2 participants',
          timestamp: new Date().toISOString()
        });
      }

      console.log(`➕ Messages API: Creating group chat with ${participantIdArray.length} participants`);

      const chat = await prisma.chat.create({
        data: {
          name: groupName || null,
          participants: {
            create: participantIdArray.map(id => ({ userId: id }))
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  email: true
                }
              }
            }
          },
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  displayName: true
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });

      console.log(`✅ Messages API: Group chat created - ID: ${chat.id}`);

      return res.status(201).json({
        chat,
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Invalid action parameter
     *
     * Return error if action is not recognized.
     */
    console.log(`🚨 Messages API: Invalid action - ${action}`);
    return res.status(400).json({
      error: 'Invalid action',
      details: 'Supported actions: chat, chats, createGroup',
      supportedActions: ['chat', 'chats', 'createGroup'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Messages API: Error in GET handler:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to fetch messages',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * POST Request Handler - Send Message
 *
 * Handles sending new messages in existing chats. Creates a message record
 * and updates the chat's last message metadata for quick preview display.
 *
 * @async
 * @function sendMessage
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.action - Action type: 'send'
 * @param {string} req.body.chatId - Chat ID where message is sent
 * @param {string} req.body.senderId - User ID of message sender
 * @param {string} req.body.text - Message text content
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response with created message
 * @throws {Error} 400 - Missing or invalid parameters
 * @throws {Error} 404 - Chat not found
 * @throws {Error} 500 - Database or server errors
 *
 * @example
 * // Send a message
 * POST /api/messages
 * {
 *   "action": "send",
 *   "chatId": "chat-123",
 *   "senderId": "user-456",
 *   "text": "Hello, how are you?"
 * }
 *
 * // Response:
 * {
 *   "message": "Message sent successfully",
 *   "data": {
 *     "id": "msg-789",
 *     "text": "Hello, how are you?",
 *     "createdAt": "2024-11-21T10:30:00.000Z"
 *   }
 * }
 */
async function sendMessage(req, res) {
  console.log('💬 Messages API: POST request received - Sending message');

  const { chatId, senderId, text } = req.body;
  console.log(`🔍 Messages API: Chat - ${chatId ? 'provided' : 'missing'}, Sender - ${senderId ? 'provided' : 'missing'}`);

  /**
   * Input validation for required parameters
   *
   * All three parameters are required to send a message:
   * - chatId: identifies the conversation
   * - senderId: identifies who is sending
   * - text: the message content
   */
  if (!chatId || !senderId || !text) {
    console.log('🚨 Messages API: Missing required parameters');
    return res.status(400).json({
      error: 'Missing required parameters',
      details: 'chatId, senderId, and text are all required',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validate message text is not empty
   *
   * Prevent sending empty or whitespace-only messages.
   */
  if (!text.trim()) {
    console.log('🚨 Messages API: Empty message text');
    return res.status(400).json({
      error: 'Message text cannot be empty',
      details: 'Provide non-empty text content',
      timestamp: new Date().toISOString()
    });
  }

  try {
    /**
     * Verify chat exists
     *
     * Ensure the chat exists before creating a message.
     * This prevents orphaned messages.
     */
    console.log(`🔍 Messages API: Verifying chat exists - ${chatId}`);

    const chatExists = await prisma.chat.findUnique({
      where: { id: chatId }
    });

    if (!chatExists) {
      console.log(`🚨 Messages API: Chat not found - ${chatId}`);
      return res.status(404).json({
        error: 'Chat not found',
        details: 'The specified chat does not exist',
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Create message record
     *
     * Store the message in the database with sender information
     * and timestamp. Include sender details for immediate UI display.
     */
    console.log('➕ Messages API: Creating message');

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        text: text.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    /**
     * Update chat metadata
     *
     * Update the chat's lastMessage and lastMessageAt fields
     * for quick preview display in chat list.
     */
    console.log('🔄 Messages API: Updating chat metadata');

    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: text.trim(),
        lastMessageAt: new Date(),
        lastMessageSenderId: senderId
      }
    });

    console.log(`✅ Messages API: Message sent successfully - ID: ${message.id}`);

    return res.status(201).json({
      message: 'Message sent successfully',
      data: message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Messages API: Error sending message:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Failed to send message',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main API Handler - Messages Endpoint
 *
 * Primary entry point for all message-related API requests.
 * Handles CORS, request routing, and error handling for the messages API.
 * Supports GET (retrieve chats/messages) and POST (send messages) methods.
 *
 * @async
 * @function handler
 * @param {Object} req - Express request object
 * @param {string} req.method - HTTP method (GET, POST, OPTIONS)
 * @param {Object} res - Express response object
 * @returns {Promise<void>} JSON response
 *
 * @example
 * // Health check
 * GET /api/messages?test=true
 *
 * // Get chat
 * GET /api/messages?action=chat&userId=123&friendId=456
 *
 * // Send message
 * POST /api/messages { "action": "send", "chatId": "...", "senderId": "...", "text": "..." }
 */
export default async function handler(req, res) {
  console.log('💬 Messages API: Request received -', req.method);

  /**
   * CORS Configuration
   *
   * Enable cross-origin requests for web applications.
   * Supports all common HTTP methods used by message operations.
   */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  /**
   * Handle preflight OPTIONS requests
   *
   * Browsers send OPTIONS requests before actual requests to check CORS.
   * Return 200 OK to allow the actual request to proceed.
   */
  if (req.method === 'OPTIONS') {
    console.log('💬 Messages API: Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  try {
    /**
     * Ensure Prisma client is connected
     *
     * Verify database connectivity before processing requests.
     * This helps catch connection issues early.
     */
    await prisma.$connect();

    /**
     * Health check endpoint - MUST be checked before method routing
     *
     * Test endpoint to verify API and database connectivity.
     * Useful for monitoring and debugging.
     */
    if (req.query.test === 'true') {
      console.log('💬 Messages API: Health check requested');
      await prisma.$connect();
      return res.status(200).json({
        message: 'Messages API is working',
        timestamp: new Date().toISOString(),
        database: 'Connected to PostgreSQL via Prisma',
        status: 'healthy'
      });
    }

    /**
     * Route GET requests to getMessages handler
     *
     * Handles chat retrieval and chat list operations.
     */
    if (req.method === 'GET') {
      return await getMessages(req, res);
    }

    /**
     * Route POST requests to sendMessage handler
     *
     * Handles message sending operations.
     */
    if (req.method === 'POST') {
      const { action } = req.body;

      if (action === 'send') {
        return await sendMessage(req, res);
      }

      // Invalid POST action
      console.log(`🚨 Messages API: Invalid POST action - ${action}`);
      return res.status(400).json({
        error: 'Invalid action',
        details: 'Supported POST actions: send',
        supportedActions: ['send'],
        timestamp: new Date().toISOString()
      });
    }

    /**
     * Handle unsupported HTTP methods
     *
     * Return a clear error message for methods that are not supported
     * by this API endpoint.
     */
    console.log('🚨 Messages API: Unsupported method -', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      details: `${req.method} method is not supported. Use GET or POST.`,
      supportedMethods: ['GET', 'POST', 'OPTIONS'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🚨 Messages API: Unexpected error:', error);
    console.error('Error stack:', error.stack);

    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  } finally {
    /**
     * Disconnect Prisma client
     *
     * Clean up database connection after request is processed.
     * Important for serverless environments to prevent connection leaks.
     */
    await prisma.$disconnect();
  }
}



