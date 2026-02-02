/**
 * Invite Member Modal
 * Modal for inviting new members to a group via email
 */

'use client';

import { useState } from 'react';
import { Send, Check, Copy } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSendInvitation } from '@/lib/api/hooks/use-invitations';

// ============================================================================
// Types
// ============================================================================

export interface InviteMemberModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** The group ID to invite to */
  groupId: string;
  /** The group name (for display) */
  groupName: string;
}

// ============================================================================
// Component
// ============================================================================

export function InviteMemberModal({
  isOpen,
  onClose,
  groupId,
  groupName,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { mutate: sendInvitation, isPending, error, reset } = useSendInvitation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) return;

    sendInvitation(
      {
        email: email.trim(),
        groupId,
        message: message.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setInviteUrl(data.inviteUrl);
        },
      }
    );
  };

  const handleCopyLink = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setEmail('');
    setMessage('');
    setInviteUrl(null);
    setCopied(false);
    reset();
    onClose();
  };

  const handleSendAnother = () => {
    setEmail('');
    setMessage('');
    setInviteUrl(null);
    reset();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Member" size="md">
      <div className="px-6 pb-6">
        {inviteUrl ? (
          // Success state
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">Invitation Sent!</h3>
            <p className="text-sm text-zinc-500 mb-6">
              An invitation has been sent to <span className="font-medium">{email}</span>
            </p>

            {/* Copy invite link */}
            <div className="bg-zinc-50 rounded-lg p-3 mb-6">
              <p className="text-xs text-zinc-500 mb-2">Or share this invite link:</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inviteUrl}
                  readOnly
                  className="flex-1 text-xs bg-white border border-zinc-200 rounded px-2 py-1.5 text-zinc-600"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleSendAnother} className="flex-1">
                Invite Another
              </Button>
              <Button variant="primary" onClick={handleClose} className="flex-1">
                Done
              </Button>
            </div>
          </div>
        ) : (
          // Form state
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-zinc-500">
              Invite someone to join <span className="font-medium">{groupName}</span>. They&apos;ll
              receive an email with an invitation link.
            </p>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">
                  {error instanceof Error ? error.message : 'Failed to send invitation'}
                </p>
              </div>
            )}

            {/* Email input */}
            <Input
              label="Email Address"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Optional message */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">
                Personal Message{' '}
                <span className="text-zinc-400 font-normal">(optional)</span>
              </label>
              <textarea
                placeholder="Hey! Join our trip planning group..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/20 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-400 text-right">{message.length}/500</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isPending}
                disabled={!email.trim()}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invitation
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
