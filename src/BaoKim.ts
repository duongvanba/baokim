import got from "got/dist/source"
import { sign } from 'jsonwebtoken'

const client = got.extend({
    prefixUrl: 'https://api.baokim.vn/payment/api/v4/',
    resolveBodyOnly: true,
    responseType: 'json',
    throwHttpErrors: false
})

export type Response<T> = {
    code: number
    message: { [key: string]: string[] },
    count: number
    data: T
}

export type CreateOrderRequest = {
    mrc_order_id: string
    total_amount: number
    description: string,
    url_success: string
    merchant_id: number
    url_detail: string
    lang: 'vi' | 'en',
    bpm_id: 0 | 1 | 2 | 14 | 15
    accept_bank: 1 | 0,
    accept_cc: 1 | 0,
    accept_qrpay: 1 | 0,
    accept_e_wallet: 1 | 0,
    webhooks: string
    customer_email: string
    customer_phone: string
    customer_name: string
    customer_address: string
}

export type CreateOrderResponse = {
    order_id: string
    payment_url: string
}

export class BaoKim {

    constructor(
        private merchant_id: number,
        private api_key: string,
        private api_secret: string
    ) {

    }

    async get<T>(uri: string, query: any = {}) {
        return await client.get(uri, { searchParams: query }) as any as Response<T>
    }

    async post<T>(uri: string, form: any = {}, query: any = {}) {

        const jwt = sign({ form_params: form }, this.api_secret, {
            issuer: this.api_key,
            jwtid: 'random',
            algorithm: 'HS256',
            expiresIn: '59s'
        })

        const { code, count, data, message } = await client.post(uri, {
            form,
            searchParams: query,
            headers: { jwt: `Bearer ${jwt}` }
        }) as any as Response<T>

        if (code == 0) return data
        throw JSON.stringify(message, null, 2)
    }

    async create_order(input: Omit<CreateOrderRequest, "merchant_id">) {
        const from: CreateOrderRequest = {
            ...input,
            merchant_id: this.merchant_id
        }
        return await this.post<CreateOrderResponse>('order/send', from)
    }


}