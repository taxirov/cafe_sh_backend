import prisma from "../database";
import { OrderCreateModel, OrderUpdateModel } from "../models/order.model";
import { Order } from "@prisma/client";

export class OrderService {
    // done
    async create(dto: OrderCreateModel) {
        return await prisma.order.create({
            data: {
                title: dto.title,
                desc: dto.desc,
                user_id: dto.user_id,
                room_id: dto.room_id
            }
        })
    }
    // done
    async update(id: number, dto: OrderUpdateModel) {
        return await prisma.order.update({
            where: { id },
            data: {
                title: dto.title,
                desc: dto.desc,
                room_id: dto.room_id,
                user_id: dto.user_id
            }
        })
    }
    // done
    async delete(id: number) {
        return await prisma.order.delete({ where: { id }})
    }
    // done
    async findAll() {
        return await prisma.order.findMany()
    }
    // done
    async findById(id: number) {
        return await prisma.order.findUnique({ where: { id }})
    }
    // done
    async findByUser(user_id: number) {
        return await prisma.order.findMany({ where: { user_id }})
    }
    // done
    async findByRoom(room_id: number) {
        return await prisma.order.findMany({ where: { room_id }})
    }
    // done
    async findByUserStatus(user_id: number, status: number) {
        return await prisma.order.findMany({ where: { user_id, status }})
    }
    // done
    async findByStatus(status: number) {
        return await prisma.order.findMany({ where: { status }})
    }
    // done
    async findByStatusRoom(status: number, room_id: number) {
        return await prisma.order.findMany({ where: { status, room_id }})
    }
    // done
    async findByUserRoom(user_id: number, room_id: number) {
        return await prisma.order.findMany({ where: { user_id, room_id }})
    }
    // done
    async findByUserStatusRoom(user_id: number, status: number, room_id: number) {
        return await prisma.order.findMany({ where: { user_id, status, room_id }})
    }
    // done
    async updateStatus(id: number, status: number) {
        return await prisma.order.update({ where: { id }, data: { status }})
    }
    // done
    async updateTotal(id: number, total_price: number) {
        return await prisma.order.update({ where: { id }, data: { total_price }})
    }
}