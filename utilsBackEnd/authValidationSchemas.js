import { z } from 'zod'

const SIGNUP_REQUIRED_MESSAGE = 'All field must be filled.'
const RESET_REQUIRED_MESSAGE = 'All fields are required.'
const ACCEPTED_TERMS_VALUES = new Set([true, 'true', 'on', 1, '1'])

function requiredString(message) {
    return z.string({
        required_error: message,
        invalid_type_error: message
    }).min(1, message)
}

function addPasswordComplexityIssue(password, ctx, path) {
    if (password.length < 8) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: 'Password must be at least 8 characters long.'
        })
        return
    }

    if (!/[A-Za-z]/.test(password)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: 'Password must contain at least one letter.'
        })
        return
    }

    if (!/[A-Z]/.test(password)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: 'Password must contain at least one uppercase letter.'
        })
        return
    }

    if (!/[0-9]/.test(password)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: 'Password must contain at least one number.'
        })
        return
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path,
            message: 'Password must contain at least one special character.'
        })
    }
}

export const signupBodySchema = z.object({
    username: requiredString(SIGNUP_REQUIRED_MESSAGE)
        .trim()
        .regex(/^[a-zA-Z0-9_-]{1,20}$/, 'Username must be 1-20 characters, using letters, numbers, _ or -.'),
    email: requiredString(SIGNUP_REQUIRED_MESSAGE)
        .trim()
        .email('Invalid email.'),
    password: requiredString(SIGNUP_REQUIRED_MESSAGE),
    termsAgree: z.any().optional()
}).superRefine((value, ctx) => {
    if (!ACCEPTED_TERMS_VALUES.has(value.termsAgree)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['termsAgree'],
            message: 'You must accept terms and conditions.'
        })
        return
    }

    addPasswordComplexityIssue(value.password, ctx, ['password'])
})

export const loginBodySchema = z.object({
    email: requiredString(SIGNUP_REQUIRED_MESSAGE)
        .email('Invalid email.'),
    password: requiredString(SIGNUP_REQUIRED_MESSAGE)
})

export const forgotPasswordBodySchema = z.object({
    email: requiredString('Invalid email.').email('Invalid email.')
})

export const verifyEmailBodySchema = z.object({
    token: requiredString('Token is required.')
})

export const resetPasswordBodySchema = z.object({
    token: requiredString('Token is required.'),
    newPassword: requiredString(RESET_REQUIRED_MESSAGE),
    confirmPassword: requiredString(RESET_REQUIRED_MESSAGE)
}).superRefine((value, ctx) => {
    if (value.newPassword !== value.confirmPassword) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['confirmPassword'],
            message: 'Passwords do not match with Confirm password.'
        })
        return
    }

    addPasswordComplexityIssue(value.newPassword, ctx, ['newPassword'])
})

export function getFirstValidationError(error) {
    return error.issues[0]?.message || 'Invalid request data.'
}
