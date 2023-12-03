import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { UserService } from "../services/user.service";
import { RoleService } from "../services/role.service";
import { RoomService } from "../services/room.service";
import { ProductService } from "../services/product.service";
import { ProductInOrderService } from '../services/productinorder.service';
import { Order, User } from '@prisma/client';
import { Payload } from './user.controller';

const orderService = new OrderService();
const userService = new UserService();
const roleService = new RoleService();
const roomService = new RoomService();
const productService = new ProductService()
const proInOrService = new ProductInOrderService()


export type ProductInOrder = {
  id: number,
  user: { id: number, name: string }
  order_id: number,
  product: { id: number, name: string, price: number, image: string | null },
  count: number,
  total_price: number,
  status: number,
  create_date: string,
  update_date: string
}

export type OrderResponse = {
  id: number,
  title: string,
  desc: string | null,
  user: { id: number, name: string } | null,
  room: { id: number, name: string } | null,
  products: ProductInOrder[],
  total_price: number | null,
  status: number,
  create_date: string,
  update_date: string
}

export class OrderController {
  async post(req: Request, res: Response) {
    try {
      const user_id = res.locals.payload.id;
      const { title, desc, room_id } = req.body;
      const user_exsist = await userService.findById(+user_id)
      if (!user_exsist) {
        res.status(404).json({
          message: "User not found by user_id: " + user_id
        })
      } else {
        if (room_id === null) {
          // create order
          const order_created = await orderService.create({ title, desc, user_id, room_id });
          // create user object
          let user: { id: number, name: string } = { id: user_exsist.id, name: user_exsist.name }
          // create room object
          let room: { id: number, name: string } | null = null
          // create response order object
          let order: OrderResponse = {
            id: order_created.id,
            title: order_created.title,
            desc: order_created.desc,
            user, room, products: [],
            total_price: order_created.total_price,
            status: order_created.status,
            create_date: order_created.create_date.toString(),
            update_date: order_created.update_date.toString()
          }
          res.status(201).json({
            message: "Order success created",
            order
          });
          const room_exsist = await roomService.findById(+room_id)
        } else {
          const room_exsist = await roomService.findById(+room_id)
          if (!room_exsist) {
            res.status(404).json({
              message: "Room not found by room_id: " + room_id
            })
          } else if (room_exsist.booked === true) {
            res.status(409).json({
              message: "Room already booked, please select another room"
            })
          } else {
            // create order
            const order_created = await orderService.create({ title, desc, user_id, room_id });
            console.log(order_created)
            // create user object
            let user: { id: number, name: string } = { id: user_exsist.id, name: user_exsist.name }
            // update status room_exsist 
            const room_order = await roomService.updateBooked(room_exsist.id, true)
            // create room object
            let room: { id: number, name: string } | null = { id: room_order.id, name: room_order.name }
            // create response order object
            let order: OrderResponse = {
              id: order_created.id,
              title: order_created.title,
              desc: order_created.desc,
              user, room, products: [],
              total_price: 0,
              status: order_created.status,
              create_date: order_created.create_date.toString(),
              update_date: order_created.update_date.toString()
            }
            res.status(201).json({
              message: "Order success created",
              order
            });
          }
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'Error creating order' });
    }
  }
  async put(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, desc, user_id, room_id } = req.body;
      const order_exsist = await orderService.findById(+id)
      if (order_exsist) {
        const order_updated = await orderService.update(+id, { title, desc, user_id, room_id });
        const user_order = await userService.findById(+user_id)
        if (user_order !== null) {
          // create user object
          let user: { id: number, name: string } = { id: user_order.id, name: user_order.name }
          // create products array
          let products: ProductInOrder[] = []
          const productInOrders = await proInOrService.findByOrderId(order_updated.id)
          for (let i = 0; i < productInOrders.length; i++) {
            const user_pro = await userService.findById(productInOrders[i].user_id)
            const product_pro = await productService.findById(productInOrders[i].product_id)
            if (user_pro !== null && product_pro !== null) {
              let product: ProductInOrder = {
                id: productInOrders[i].id,
                user: { id: user_pro.id, name: user_pro.name },
                order_id: productInOrders[i].order_id,
                product: { id: product_pro.id, name: product_pro.name, price: product_pro.price, image: product_pro.image },
                count: productInOrders[i].count,
                total_price: productInOrders[i].count * product_pro.price,
                create_date: productInOrders[i].create_date.toString(),
                update_date: productInOrders[i].update_date.toString(),
                status: productInOrders[i].status
              }
              products.push(product)
            }
          }
          // create room object
          let room: { id: number, name: string } | null
          if (room_id === null) {
            room = null
            let order: OrderResponse = {
              id: order_updated.id,
              title: order_updated.title,
              desc: order_updated.desc,
              user, room, products: [],
              total_price: order_updated.total_price,
              status: order_updated.status,
              create_date: order_updated.create_date.toString(),
              update_date: order_updated.update_date.toString()
            }
            res.status(201).json({ message: "Order success updated", order })
          } else {
            const room_order = await roomService.findById(+room_id)
            if (room_order) {
              room = { id: room_order.id, name: room_order.name }
              // create response order object
              let order: OrderResponse = {
                id: order_updated.id,
                title: order_updated.title,
                desc: order_updated.desc,
                user, room: room, products,
                total_price: order_updated.total_price,
                status: order_updated.status,
                create_date: order_updated.create_date.toString(),
                update_date: order_updated.update_date.toString()
              }
              res.status(201).json({
                message: "Order success updated",
                order
              });
            }
          }
        }
      }
      else { res.status(404).json({ message: 'Order not found' }) }
    } catch (error) {
      res.status(500).json({ message: 'Error updating order' });
    }
  }
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const order_exsist = await orderService.findById(+id)
      if (order_exsist) {
        const order_deleted = await orderService.delete(+id);
        const user_order = await userService.findById(order_deleted.user_id);
        if (user_order !== null) {
          // create user object
          let user: { id: number, name: string } = { id: user_order.id, name: user_order.name }
          // create products array
          let products: ProductInOrder[] = []
          const productInOrders = await proInOrService.findByOrderId(order_deleted.id)
          for (let i = 0; i < productInOrders.length; i++) {
            const user_pro = await userService.findById(productInOrders[i].user_id)
            const product_pro = await productService.findById(productInOrders[i].product_id)
            if (user_pro !== null && product_pro !== null) {
              let product: ProductInOrder = {
                id: productInOrders[i].id,
                user: { id: user_pro.id, name: user_pro.name },
                order_id: productInOrders[i].order_id,
                product: { id: product_pro.id, name: product_pro.name, price: product_pro.price, image: product_pro.image },
                count: productInOrders[i].count,
                total_price: productInOrders[i].count * product_pro.price,
                create_date: productInOrders[i].create_date.toString(),
                update_date: productInOrders[i].update_date.toString(),
                status: productInOrders[i].status
              }
              products.push(product)
            }
          }
          // create room object
          let room: { id: number, name: string } | null
          if (order_deleted.room_id === null) {
            room = null
            let order: OrderResponse = {
              id: order_deleted.id,
              title: order_deleted.title,
              desc: order_deleted.desc,
              user, room, products: [],
              total_price: order_deleted.total_price,
              status: order_deleted.status,
              create_date: order_deleted.create_date.toString(),
              update_date: order_deleted.update_date.toString()
            }
            res.status(201).json({ message: "Order success deleted", order })
          } else {
            const room_order = await roomService.findById(order_deleted.room_id)
            if (room_order) {
              room = { id: room_order.id, name: room_order.name }
              // create response order object
              let order: OrderResponse = {
                id: order_deleted.id,
                title: order_deleted.title,
                desc: order_deleted.desc,
                user, room: room, products,
                total_price: order_deleted.total_price,
                status: order_deleted.status,
                create_date: order_deleted.create_date.toString(),
                update_date: order_deleted.update_date.toString()
              }
              const room_free = await roomService.updateBooked(room.id, false)
              res.status(201).json({ message: "Order success deleted", order });
            }
          }
        }
      }
      else { res.status(404).json({ message: 'Order not found' }) }
    } catch (error) {
      res.status(500).json({ message: 'Error deleting order' });
    }
  }
  async get(req: Request, res: Response) {
    try {
      const user: Payload = res.locals.payload
      const { status_order, room_id, user_id, current_page, per_page } = req.query
      const user_exsist = await userService.findById(user.id)
      if (user_exsist) {
        const user_role = await roleService.findById(user_exsist.role_id);
        if (user_role !== null && user_role.name === 'admin') {
          async function takeOrders(orders: Order[]) {
            let orders_res: OrderResponse[] = []
            for (let i = 1; i < orders.length; i++) {
              // create user object
              let user: { id: number, name: string } | null = await userService.findCustomById(orders[i].user_id)
              // create room object
              let room: { id: number, name: string } | null = await roomService.findCustomById(orders[i].room_id)
              // create products list
              let products: ProductInOrder[] = []
              const productInOrders = await proInOrService.findByOrderId(orders[i].id)
              for (let i = 0; i < productInOrders.length; i++) {
                const user_pro = await userService.findCustomById(productInOrders[i].user_id)
                const product_pro = await productService.findCustomById(productInOrders[i].product_id)
                if (user_pro !== null && product_pro !== null) {
                  let product: ProductInOrder = {
                    id: productInOrders[i].id,
                    user: user_pro,
                    order_id: productInOrders[i].order_id,
                    product: product_pro,
                    count: productInOrders[i].count,
                    total_price: productInOrders[i].count * product_pro.price,
                    create_date: productInOrders[i].create_date.toString(),
                    update_date: productInOrders[i].update_date.toString(),
                    status: productInOrders[i].status
                  }
                  products.push(product)
                }
              }
              let order: OrderResponse = {
                id: orders[i].id,
                title: orders[i].title,
                desc: orders[i].desc,
                user, room, products,
                total_price: orders[i].total_price,
                status: orders[i].status,
                create_date: orders[i].create_date.toString(),
                update_date: orders[i].update_date.toString()
              }
              orders_res.push(order)
            } return orders_res
          }
          const default_current_page = 1
          const default_per_page = 12
          let total_order_count = (await orderService.findAll()).length
          let total_page_count: number = 1
          if (total_order_count > default_per_page) {
            total_page_count = Math.floor(total_order_count / default_per_page)
            if (total_order_count % default_per_page > 0) {
              total_page_count += 1
            }
          }
          if (per_page !== undefined && current_page !== undefined && per_page !== '' && current_page !== '') {
            // orders by status_order, room_id and user_id
            if (status_order !== undefined && status_order !== '') {
              if (room_id !== undefined && room_id !== '') {
                if (user_id !== undefined && user_id !== '') {
                  let orders_status_room_user = await orderService.findByUserStatusRoom(+user_id, +status_order, +room_id, +current_page, +per_page)
                  let orders: OrderResponse[] = await takeOrders(orders_status_room_user)
                  total_order_count = orders.length
                  if (total_order_count > +per_page) {
                    total_page_count = Math.floor(total_order_count / +per_page)
                    if (total_order_count % (+per_page) > 0) {
                      total_page_count += 1
                    }
                  }
                  res.status(200).json({
                    orders,
                    status_order: +status_order,
                    room_id: +room_id,
                    user_id: +user_id,
                    current_page: +current_page,
                    per_page: +per_page,
                    total_page_count,
                    total_order_count
                  })
                } else {
                  const orders_status_room = await orderService.findByStatusRoom(+status_order, +room_id, +current_page, +per_page)
                  let orders: OrderResponse[] = await takeOrders(orders_status_room)
                  total_order_count = orders.length
                  if (total_order_count > +per_page) {
                    total_page_count = Math.floor(total_order_count / +per_page)
                    if (total_order_count % (+per_page) > 0) {
                      total_page_count += 1
                    }
                  }
                  res.status(200).json({
                    orders,
                    status_order: +status_order,
                    room_id: +room_id,
                    user_id: undefined,
                    current_page: +current_page,
                    per_page: +per_page,
                    total_page_count,
                    total_order_count
                  })
                }
              } else {
                const orders_status = await orderService.findByStatus(+status_order, +current_page, +per_page)
                let orders: OrderResponse[] = await takeOrders(orders_status)
                total_order_count = orders.length
                if (total_order_count > +per_page) {
                  total_page_count = Math.floor(total_order_count / +per_page)
                  if (total_order_count % (+per_page) > 0) {
                    total_page_count += 1
                  }
                }
                res.status(200).json({
                  orders,
                  status_order: +status_order,
                  room_id: undefined,
                  user_id: undefined,
                  current_page: +current_page,
                  per_page: +per_page,
                  total_page_count,
                  total_order_count
                })
              }
            }
            // orders by room_id and user_id
            else if (room_id !== undefined && room_id !== '') {
              if (user_id !== undefined && user_id !== '') {
                let orders_room_user = await orderService.findByUserRoom(+user_id, +room_id, +current_page, +per_page)
                let orders: OrderResponse[] = await takeOrders(orders_room_user)
                total_order_count = orders.length
                if (total_order_count > +per_page) {
                  total_page_count = Math.floor(total_order_count / +per_page)
                  if (total_order_count % (+per_page) > 0) {
                    total_page_count += 1
                  }
                }
                res.status(200).json({
                  orders,
                  status_order: undefined,
                  room_id: +room_id,
                  user_id: +user_id,
                  current_page: +current_page,
                  per_page: +per_page,
                  total_page_count,
                  total_order_count
                })
              } else {
                const orders_room = await orderService.findByRoom(+room_id, +current_page, +per_page)
                let orders: OrderResponse[] = await takeOrders(orders_room)
                total_order_count = orders.length
                if (total_order_count > +per_page) {
                  total_page_count = Math.floor(total_order_count / +per_page)
                  if (total_order_count % (+per_page) > 0) {
                    total_page_count += 1
                  }
                }
                res.status(200).json({
                  orders,
                  status_order: undefined,
                  room_id: +room_id,
                  user_id: undefined,
                  current_page: +current_page,
                  per_page: +per_page,
                  total_page_count,
                  total_order_count
                })
              }
            }
            // orders by user_id
            else if (user_id !== undefined && user_id !== '') {
              let orders_user = await orderService.findByUser(+user_id, +current_page, +per_page)
              let orders: OrderResponse[] = await takeOrders(orders_user)
              total_order_count = orders.length
              if (total_order_count > +per_page) {
                total_page_count = Math.floor(total_order_count / +per_page)
                if (total_order_count % (+per_page) > 0) {
                  total_page_count += 1
                }
              }
              res.status(200).json({
                orders,
                status_order: undefined,
                room_id: undefined,
                user_id: +user_id,
                current_page: +current_page,
                per_page: +per_page,
                total_page_count,
                total_order_count
              })
            }
            // orders by pagination
            else {
              const orders_pag = await orderService.findAllByPagination(+current_page, +per_page)
              let orders: OrderResponse[] = await takeOrders(orders_pag)
              total_order_count = orders.length
              if (total_order_count > +per_page) {
                total_page_count = Math.floor(total_order_count / +per_page)
                if (total_order_count % (+per_page) > 0) {
                  total_page_count += 1
                }
              }
              res.status(200).json({
                orders,
                status_order: undefined,
                room_id: undefined,
                user_id: undefined,
                current_page: +current_page,
                per_page: +per_page,
                total_page_count,
                total_order_count
              })
            }
          } else {
            const orders_default = await orderService.findAllByPagination(default_current_page, default_per_page)
            let orders: OrderResponse[] = await takeOrders(orders_default)
            total_order_count = orders.length
            if (total_order_count > default_per_page) {
              total_page_count = Math.floor(total_order_count / default_per_page)
              if (total_order_count % default_per_page > 0) {
                total_page_count += 1
              }
            }
            res.status(200).json({
              orders,
              status_order: undefined,
              room_id: undefined,
              user_id: undefined,
              current_page: default_current_page,
              per_page: default_per_page,
              total_page_count,
              total_order_count
            })
          }
        } else {
          res.status(403).json({ message: "You are not admin, this endpoint only admins" })
        }
      }
    } catch (error) {
      res.status(500).json({ message: "Error getting orders", error })
    }
  }
  async getWaiter(req: Request, res: Response) {
    try {
      const user_id = +res.locals.payload.id
      const user_exsist = await userService.findById(user_id)
      if (user_exsist) {
        const user_role = await roleService.findById(user_exsist.role_id)
        if (user_role !== null && user_role.name === 'waiter') {
          async function findWaiterOrders(orders: Order[]) {
            let waiter_orders: OrderResponse[] = []
            for (let i = 1; i < orders.length; i++) {
              // create user object
              let user: { id: number, name: string } | null = await userService.findCustomById(orders[i].user_id)
              // create room object
              let room: { id: number, name: string } | null = await roomService.findCustomById(orders[i].room_id)
              // create products list
              let products: ProductInOrder[] = []
              const productInOrders = await proInOrService.findByOrderId(orders[i].id)
              for (let i = 0; i < productInOrders.length; i++) {
                const user_pro = await userService.findById(productInOrders[i].user_id)
                const product_pro = await productService.findById(productInOrders[i].product_id)
                if (user_pro !== null && product_pro !== null) {
                  let product: ProductInOrder = {
                    id: productInOrders[i].id,
                    user: { id: user_pro.id, name: user_pro.name },
                    order_id: productInOrders[i].order_id,
                    product: { id: product_pro.id, name: product_pro.name, price: product_pro.price, image: product_pro.image },
                    count: productInOrders[i].count,
                    total_price: productInOrders[i].count * product_pro.price,
                    create_date: productInOrders[i].create_date.toString(),
                    update_date: productInOrders[i].update_date.toString(),
                    status: productInOrders[i].status
                  }
                  products.push(product)
                }
              }
              let order: OrderResponse = {
                id: orders[i].id,
                title: orders[i].title,
                desc: orders[i].desc,
                user, room, products: [],
                total_price: orders[i].total_price,
                status: orders[i].status,
                create_date: orders[i].create_date.toString(),
                update_date: orders[i].update_date.toString()
              }
              waiter_orders.push(order)
            }
            return waiter_orders
          }
          const orders_waiter = await orderService.findByUserStatus(user_exsist.id, 1)
          let orders: OrderResponse[] = await findWaiterOrders(orders_waiter)
          res.status(200).json({
            message: user_exsist.name + " orders",
            orders
          })
        } else {
          res.status(403).json({ message: "You are not waiter, this endpoint only waiters" })
        }
      } else {
        res.status(404).json({ message: "User not found" })
      }
    } catch (error) {
      res.status(500).json({ message: "Error getting orders", error })
    }
  }
  async patchStatus(req: Request, res: Response) {
    try {
      const { id } = req.params
      const { status } = req.body
      const order_exsist = await orderService.findById(+id)
      if (!order_exsist) {
        res.status(404).json({
          message: "Order not found by id: " + id
        })
      } else {
        const order_updated = await orderService.updateStatus(+id, +status);
        const user_order = await userService.findById(order_updated.user_id);
        if (user_order !== null) {
          // create user object
          let user: { id: number, name: string } = { id: user_order.id, name: user_order.name }
          // create products array
          let products: ProductInOrder[] = []
          const productInOrders = await proInOrService.findByOrderId(order_updated.id)
          for (let i = 0; i < productInOrders.length; i++) {
            const user_pro = await userService.findById(productInOrders[i].user_id)
            const product_pro = await productService.findById(productInOrders[i].product_id)
            if (user_pro !== null && product_pro !== null) {
              let product: ProductInOrder = {
                id: productInOrders[i].id,
                user: { id: user_pro.id, name: user_pro.name },
                order_id: productInOrders[i].order_id,
                product: { id: product_pro.id, name: product_pro.name, price: product_pro.price, image: product_pro.image },
                count: productInOrders[i].count,
                total_price: productInOrders[i].count * product_pro.price,
                create_date: productInOrders[i].create_date.toString(),
                update_date: productInOrders[i].update_date.toString(),
                status: productInOrders[i].status
              }
              products.push(product)
            }
          }
          // create room object
          let room: { id: number, name: string } | null = await roomService.findCustomById(order_updated.room_id)
          let order: OrderResponse = {
            id: order_updated.id,
            title: order_updated.title,
            desc: order_updated.desc,
            user, room, products,
            total_price: order_updated.total_price,
            status: order_updated.status,
            create_date: order_updated.create_date.toString(),
            update_date: order_updated.update_date.toString()
          }
          if (room) {
            await roomService.updateBooked(room.id, false)
          }
          res.status(200).json({
            message: "Order status success updated",
            order
          })
        }
      }
    } catch (error) {
      res.status(500).json({
        message: "Error patching status"
      })
    }
  }
}
