import { Request, Response, NextFunction } from 'express';
import { invitationsService } from './invitations.service';
import {
  SendInvitationSchema,
  RespondToInvitationSchema,
  ListInvitationsSchema,
  ResendInvitationSchema,
  CancelInvitationSchema,
} from './invitations.types';
import { ValidationError } from '../../common/utils/errors';
import type { ApiResponse } from '../../common/types/api';
import type {
  SendInvitationResponse,
  ListInvitationsResponse,
  RespondToInvitationResponse,
} from './invitations.types';

/**
 * Invitations Controller
 *
 * Handles HTTP requests for invitation endpoints
 */
export class InvitationsController {
  /**
   * Send an invitation to join a group
   * POST /api/v1/invitations
   */
  async sendInvitation(
    req: Request,
    res: Response<ApiResponse<SendInvitationResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = SendInvitationSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await invitationsService.sendInvitation(validatedData, userId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Respond to an invitation (accept or decline)
   * POST /api/v1/invitations/respond
   */
  async respondToInvitation(
    req: Request,
    res: Response<ApiResponse<RespondToInvitationResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = RespondToInvitationSchema.parse(req.body);
      const userId = req.user!.id;

      const result = await invitationsService.respondToInvitation(validatedData, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * List invitations sent by the user
   * GET /api/v1/invitations/sent
   */
  async listSentInvitations(
    req: Request,
    res: Response<ApiResponse<ListInvitationsResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = ListInvitationsSchema.parse(req.query);
      const userId = req.user!.id;

      const result = await invitationsService.listInvitations(validatedData, userId, 'sent');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * List invitations received by the user
   * GET /api/v1/invitations/received
   */
  async listReceivedInvitations(
    req: Request,
    res: Response<ApiResponse<ListInvitationsResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const validatedData = ListInvitationsSchema.parse(req.query);
      const userId = req.user!.id;

      const result = await invitationsService.listInvitations(validatedData, userId, 'received');

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Resend an invitation
   * POST /api/v1/invitations/:invitationId/resend
   */
  async resendInvitation(
    req: Request,
    res: Response<ApiResponse<SendInvitationResponse>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { invitationId } = ResendInvitationSchema.parse({
        invitationId: req.params.invitationId,
      });
      const userId = req.user!.id;

      const result = await invitationsService.resendInvitation(invitationId, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }

  /**
   * Cancel an invitation
   * DELETE /api/v1/invitations/:invitationId
   */
  async cancelInvitation(
    req: Request,
    res: Response<ApiResponse<{ success: boolean }>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const { invitationId } = CancelInvitationSchema.parse({
        invitationId: req.params.invitationId,
      });
      const userId = req.user!.id;

      await invitationsService.cancelInvitation(invitationId, userId);

      res.status(200).json({
        success: true,
        data: { success: true },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new ValidationError('Invalid input', error));
      } else {
        next(error);
      }
    }
  }
}

export const invitationsController = new InvitationsController();
