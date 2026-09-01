export const logicalOperators = {
    "=": "equals",
    "!=": "is not",
    LIKE: "contains",
    "NOT LIKE": "does not contain",
    ">": "is greater than",
    ">=": "is at least",
    "<": "is less than",
    "<=": "is at most",
    IN: "is one of",
    "NOT IN": "is not one of",
    "IS NULL": "is empty",
    "IS NOT NULL": "is not empty",
} as const;
