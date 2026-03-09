import { getFirstValidationError } from './authValidationSchemas.js'

export function validateBody(schema) {
    return (req, res, next) => {
        const parsedBody = schema.safeParse(req.body)

        if (!parsedBody.success) {
            return res.status(400).json({ error: getFirstValidationError(parsedBody.error) })
        }

        req.validatedBody = parsedBody.data
        next()
    }
}
