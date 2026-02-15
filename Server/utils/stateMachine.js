import ApiError from "./ApiError.js";
import { ROLES } from "./constant.js";
export const COMPLAINT_STATES = {
  CREATED: "CREATED",
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  RESOLVED: "RESOLVED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN", 
};
export const VALID_TRANSITIONS = {
  [COMPLAINT_STATES.CREATED]: {
    allowed: [
      COMPLAINT_STATES.ASSIGNED,
      COMPLAINT_STATES.REJECTED,
      COMPLAINT_STATES.WITHDRAWN,
    ],
    allowedBy: [ROLES.ADMIN, ROLES.SUPERVISOR, ROLES.CITIZEN],
    description: "New complaint can be assigned, rejected, or withdrawn",
  },
  [COMPLAINT_STATES.ASSIGNED]: {
    allowed: [
      COMPLAINT_STATES.IN_PROGRESS,
      COMPLAINT_STATES.REJECTED,
      COMPLAINT_STATES.WITHDRAWN,
    ],
    allowedBy: [ROLES.SUPERVISOR, ROLES.OFFICER, ROLES.CITIZEN],
    description:
      "Assigned complaint can be marked in progress, rejected, or withdrawn",
  },
  [COMPLAINT_STATES.IN_PROGRESS]: {
    allowed: [
      COMPLAINT_STATES.PENDING_VERIFICATION,
      COMPLAINT_STATES.REJECTED,
      COMPLAINT_STATES.WITHDRAWN,
    ],
    allowedBy: [ROLES.OFFICER, ROLES.SUPERVISOR, ROLES.CITIZEN],
    description:
      "In-progress complaint can be sent for verification, rejected, or withdrawn",
  },
  [COMPLAINT_STATES.PENDING_VERIFICATION]: {
    allowed: [
      COMPLAINT_STATES.RESOLVED,
      COMPLAINT_STATES.ASSIGNED,
      COMPLAINT_STATES.REJECTED,
    ],
    allowedBy: [ROLES.SUPERVISOR, ROLES.ADMIN],
    description:
      "Pending verification complaint can be verified, reassigned, or rejected",
  },
  [COMPLAINT_STATES.RESOLVED]: {
    allowed: [COMPLAINT_STATES.ASSIGNED], 
    allowedBy: [ROLES.ADMIN, ROLES.SUPERVISOR],
    description: "Resolved complaint can be reopened and reassigned",
  },
  [COMPLAINT_STATES.REJECTED]: {
    allowed: [COMPLAINT_STATES.ASSIGNED], 
    allowedBy: [ROLES.ADMIN, ROLES.SUPERVISOR],
    description: "Rejected complaint can be reassigned",
  },
  [COMPLAINT_STATES.WITHDRAWN]: {
    allowed: [],
    allowedBy: [],
    description: "Withdrawn complaint cannot be changed",
  },
};

export const validateStateTransition = (from, to, role) => {
  if (!VALID_TRANSITIONS[from]) {
    throw new ApiError(`Invalid from state: ${from}`, 400);
  }
  if (!VALID_TRANSITIONS[from].allowed.includes(to)) {
    throw new ApiError(
      `Invalid transition from ${from} to ${to} for role ${role}. Allowed transitions: ${VALID_TRANSITIONS[from].allowed.join(", ")}`,
      400,
    );
  }
  if (!VALID_TRANSITIONS[from].allowedBy.includes(role)) {
    throw new ApiError(
      `Role ${role} is not authorized for this transition. Authorized roles: ${VALID_TRANSITIONS[from].allowedBy.join(", ")}`,
      403,
    );
  }

  return true;
};
export const getAllowedTransitions = (currentState, role) => {
  if (!VALID_TRANSITIONS[currentState]) {
    return [];
  }
  return VALID_TRANSITIONS[currentState].allowed.filter((toState) => {
    return VALID_TRANSITIONS[currentState].allowedBy.includes(role);
  });
};
export const isTransitionAllowed = (from, to, role) => {
  try {
    validateStateTransition(from, to, role);
    return true;
  } catch (error) {
    return false;
  }
};
export const getNextState = (currentState, role) => {
  const transitions = getAllowedTransitions(currentState, role);

  if (transitions.length === 0) {
    return currentState;
  }
  switch (currentState) {
    case COMPLAINT_STATES.CREATED:
      return role === ROLES.CITIZEN
        ? COMPLAINT_STATES.WITHDRAWN
        : COMPLAINT_STATES.ASSIGNED;
    case COMPLAINT_STATES.ASSIGNED:
      return COMPLAINT_STATES.IN_PROGRESS;
    case COMPLAINT_STATES.IN_PROGRESS:
      return role === ROLES.OFFICER
        ? COMPLAINT_STATES.PENDING_VERIFICATION
        : COMPLAINT_STATES.REJECTED;
    case COMPLAINT_STATES.PENDING_VERIFICATION:
      return COMPLAINT_STATES.RESOLVED;
    case COMPLAINT_STATES.RESOLVED:
      return COMPLAINT_STATES.ASSIGNED;
    case COMPLAINT_STATES.REJECTED:
      return COMPLAINT_STATES.ASSIGNED;
    default:
      return currentState;
  }
};
export const getAllowedStatesForRole = (role) => {
  const states = [];

  Object.keys(VALID_TRANSITIONS).forEach((state) => {
    if (VALID_TRANSITIONS[state].allowedBy.includes(role)) {
      states.push(state);
    }
  });

  return states;
};
export const getTransitionDescription = (from, to) => {
  if (!VALID_TRANSITIONS[from]) {
    return "Invalid from state";
  }

  return VALID_TRANSITIONS[from].description;
};
