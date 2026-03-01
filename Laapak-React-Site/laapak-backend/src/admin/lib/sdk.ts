import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
    baseUrl: "http://localhost:9000",
    debug: false,
    auth: {
        type: "session",
    },
})
