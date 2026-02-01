export const GroupRole = {
    OWNER: "OWNER",
    ADMIN: "ADMIN",
    MEMBER: "MEMBER",
    VIEWER: "VIEWER"
} as const;
export type GroupRole = (typeof GroupRole)[keyof typeof GroupRole];
export const TripStatus = {
    PLANNING: "PLANNING",
    CONFIRMED: "CONFIRMED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"
} as const;
export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];
export const PollType = {
    PLACE: "PLACE",
    ACTIVITY: "ACTIVITY",
    DATE: "DATE",
    CUSTOM: "CUSTOM"
} as const;
export type PollType = (typeof PollType)[keyof typeof PollType];
export const PollStatus = {
    ACTIVE: "ACTIVE",
    CLOSED: "CLOSED",
    ARCHIVED: "ARCHIVED"
} as const;
export type PollStatus = (typeof PollStatus)[keyof typeof PollStatus];
export const ItineraryItemType = {
    ACCOMMODATION: "ACCOMMODATION",
    TRANSPORT: "TRANSPORT",
    ACTIVITY: "ACTIVITY",
    MEAL: "MEAL",
    CUSTOM: "CUSTOM"
} as const;
export type ItineraryItemType = (typeof ItineraryItemType)[keyof typeof ItineraryItemType];
export const ExpenseCategory = {
    ACCOMMODATION: "ACCOMMODATION",
    TRANSPORT: "TRANSPORT",
    FOOD: "FOOD",
    ACTIVITIES: "ACTIVITIES",
    SHOPPING: "SHOPPING",
    OTHER: "OTHER"
} as const;
export type ExpenseCategory = (typeof ExpenseCategory)[keyof typeof ExpenseCategory];
export const SplitType = {
    EQUAL: "EQUAL",
    CUSTOM: "CUSTOM",
    PERCENTAGE: "PERCENTAGE"
} as const;
export type SplitType = (typeof SplitType)[keyof typeof SplitType];
export const InvitationStatus = {
    PENDING: "PENDING",
    ACCEPTED: "ACCEPTED",
    DECLINED: "DECLINED",
    EXPIRED: "EXPIRED"
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];
export const ActivityType = {
    GROUP_CREATED: "GROUP_CREATED",
    MEMBER_JOINED: "MEMBER_JOINED",
    MEMBER_LEFT: "MEMBER_LEFT",
    TRIP_CREATED: "TRIP_CREATED",
    TRIP_UPDATED: "TRIP_UPDATED",
    TRIP_DELETED: "TRIP_DELETED",
    TRIP_STATUS_CHANGED: "TRIP_STATUS_CHANGED",
    POLL_CREATED: "POLL_CREATED",
    VOTE_CAST: "VOTE_CAST",
    EXPENSE_ADDED: "EXPENSE_ADDED",
    EXPENSE_UPDATED: "EXPENSE_UPDATED",
    ITINERARY_ADDED: "ITINERARY_ADDED",
    ITINERARY_UPDATED: "ITINERARY_UPDATED"
} as const;
export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];
