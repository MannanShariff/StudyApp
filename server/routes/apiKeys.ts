import { Router, Request, Response } from 'express';
import { User } from '../models/User.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

// Validation schema for API keys
const apiKeysSchema = z.object({
  openai: z.string().optional(),
  gemini: z.string().optional(),
  grok: z.string().optional(),
  deepseek: z.string().optional()
});

// @route   GET /api/keys
// @desc    Get user's API keys
// @access  Private
router.get('/', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      apiKeys: {
        openai: user.apiKeys.openai ? '••••••••' + user.apiKeys.openai.slice(-4) : '',
        gemini: user.apiKeys.gemini ? '••••••••' + user.apiKeys.gemini.slice(-4) : '',
        grok: user.apiKeys.grok ? '••••••••' + user.apiKeys.grok.slice(-4) : '',
        deepseek: user.apiKeys.deepseek ? '••••••••' + user.apiKeys.deepseek.slice(-4) : ''
      },
      hasKeys: {
        openai: !!user.apiKeys.openai,
        gemini: !!user.apiKeys.gemini,
        grok: !!user.apiKeys.grok,
        deepseek: !!user.apiKeys.deepseek
      }
    });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/keys
// @desc    Save/Update user's API keys
// @access  Private
router.post('/', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const validatedData = apiKeysSchema.parse(req.body);
    const user = authReq.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update only provided keys
    const updateFields: any = {};
    
    if (validatedData.openai !== undefined) {
      updateFields['apiKeys.openai'] = validatedData.openai;
    }
    if (validatedData.gemini !== undefined) {
      updateFields['apiKeys.gemini'] = validatedData.gemini;
    }
    if (validatedData.grok !== undefined) {
      updateFields['apiKeys.grok'] = validatedData.grok;
    }
    if (validatedData.deepseek !== undefined) {
      updateFields['apiKeys.deepseek'] = validatedData.deepseek;
    }

    console.log('Updating API keys for user:', (user as any)._id, 'with fields:', updateFields);
    const updatedUser = await User.findByIdAndUpdate((user as any)._id, { $set: updateFields }, { new: true });
    console.log('Updated user API keys:', updatedUser?.apiKeys);

    res.json({
      success: true,
      message: 'API keys updated successfully'
    });
  } catch (error) {
    console.error('Save API keys error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/keys/actual
// @desc    Get actual API keys for use (not masked)
// @access  Private
router.get('/actual', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const user = authReq.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      apiKeys: user.apiKeys
    });
  } catch (error) {
    console.error('Get actual API keys error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/keys/:provider
// @desc    Delete specific API key
// @access  Private
router.delete('/:provider', authenticate as any, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const { provider } = req.params;
    const user = authReq.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const validProviders = ['openai', 'gemini', 'grok', 'deepseek'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid provider'
      });
    }

    const updateField = `apiKeys.${provider}`;
    await User.findByIdAndUpdate((user as any)._id, { [updateField]: '' });

    res.json({
      success: true,
      message: `${provider} API key deleted successfully`
    });
  } catch (error) {
    console.error('Delete API key error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;