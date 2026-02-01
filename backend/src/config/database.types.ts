import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { GroupRole, TripStatus, PollType, PollStatus, ItineraryItemType, ExpenseCategory, SplitType, InvitationStatus, ActivityType } from "./enums";

export type ActivityLog = {
    id: string;
    tripId: string | null;
    userId: string;
    type: ActivityType;
    metadata: unknown | null;
    createdAt: Generated<Timestamp>;
};
export type Expense = {
    id: string;
    tripId: string;
    title: string;
    description: string | null;
    category: ExpenseCategory;
    amount: string;
    currency: Generated<string>;
    paidBy: string;
    paidAt: Generated<Timestamp>;
    receiptUrl: string | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type ExpenseSplit = {
    id: string;
    expenseId: string;
    userId: string;
    splitType: Generated<SplitType>;
    amount: string;
    isPaid: Generated<boolean>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    paidAt: Timestamp | null;
};
export type Group = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    creatorId: string;
    isPrivate: Generated<boolean>;
    settings: unknown | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type GroupMember = {
    id: string;
    groupId: string;
    userId: string;
    role: Generated<GroupRole>;
    joinedAt: Generated<Timestamp>;
    invitedBy: string | null;
};
export type Invitation = {
    id: string;
    groupId: string;
    email: string;
    token: string;
    sentBy: string;
    recipientId: string | null;
    status: Generated<InvitationStatus>;
    expiresAt: Timestamp;
    createdAt: Generated<Timestamp>;
    respondedAt: Timestamp | null;
};
export type ItineraryItem = {
    id: string;
    tripId: string;
    title: string;
    description: string | null;
    type: ItineraryItemType;
    startTime: Timestamp;
    endTime: Timestamp | null;
    location: string | null;
    coordinates: unknown | null;
    cost: string | null;
    url: string | null;
    notes: string | null;
    createdBy: string;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Poll = {
    id: string;
    tripId: string;
    title: string;
    description: string | null;
    type: PollType;
    status: Generated<PollStatus>;
    allowMultiple: Generated<boolean>;
    maxVotes: number | null;
    closesAt: Timestamp | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type PollOption = {
    id: string;
    pollId: string;
    label: string;
    description: string | null;
    metadata: unknown | null;
    displayOrder: Generated<number>;
};
export type Session = {
    id: string;
    userId: string;
    token: string;
    expiresAt: Timestamp;
    createdAt: Generated<Timestamp>;
    lastUsedAt: Generated<Timestamp>;
    ipAddress: string | null;
    userAgent: string | null;
};
export type Trip = {
    id: string;
    groupId: string;
    name: string;
    description: string | null;
    destination: string | null;
    imageUrl: string | null;
    startDate: Timestamp | null;
    endDate: Timestamp | null;
    totalBudget: string | null;
    currency: Generated<string>;
    status: Generated<TripStatus>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type User = {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    avatarUrl: string | null;
    timezone: Generated<string>;
    bio: string | null;
    interests: string[];
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    lastLoginAt: Timestamp | null;
    emailVerifiedAt: Timestamp | null;
};
export type Vote = {
    id: string;
    pollId: string;
    optionId: string;
    userId: string;
    createdAt: Generated<Timestamp>;
};
export type DB = {
    activity_logs: ActivityLog;
    expense_splits: ExpenseSplit;
    expenses: Expense;
    group_members: GroupMember;
    groups: Group;
    invitations: Invitation;
    itinerary_items: ItineraryItem;
    poll_options: PollOption;
    polls: Poll;
    sessions: Session;
    trips: Trip;
    users: User;
    votes: Vote;
};
