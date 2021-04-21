import { Injectable } from '@nestjs/common'
import { plainToClass } from 'class-transformer'
import { Model, Types, Document } from 'mongoose'

// Pagination
import { fromCursorHash, PaginationArgs } from '../utils/Pagination'

// Auth
import { ForbiddenError } from '@casl/ability'
import { Action } from '../casl/casl-ability.factory'
import { CaslAbilityFactory } from '../casl/casl-ability.factory'

// User
import { User } from '../entities/user/user.model'
import { School } from '../entities/school/school.model'
@Injectable()
export abstract class BaseService {
  abstract dbModel: any // mongoose.Model<mongoose.Document>
  abstract modelClass: any //{ new (): any }
  abstract context: any //{ new (): any }

  get currentUser(): User | undefined {
    return this.context.req?.user
  }

  async checkPermissons(params: {
    action: Action
    resourceId?: Types.ObjectId
    modelClass?: any
    dbModel?: any
    record?: any // Record to be persisted, on create
  }): Promise<Model<Document>> {
    const { action, resourceId, modelClass, dbModel, record } = params
    // Checks permissons for a single record
    const ability = CaslAbilityFactory.createForUser(this.currentUser)
    if (resourceId) {
      const doc = await (dbModel || this.dbModel).findById(resourceId).exec()
      const model = plainToClass(
        modelClass || this.modelClass,
        doc?.toObject(),
      ) as any
      ForbiddenError.from(ability).throwUnlessCan(action, record || model)
      return doc
    } else {
      ForbiddenError.from(ability).throwUnlessCan(
        action,
        record || (this.modelClass as any),
      )
    }
  }

  async getById(_id: Types.ObjectId): Promise<Model<Document>> {
    return this.checkPermissons({
      action: Action.Read,
      resourceId: _id,
    })
  }

  async update(payload): Promise<Model<Document>> {
    await this.checkPermissons({
      action: Action.Update,
      resourceId: payload._id,
    })
    return this.dbModel
      .findByIdAndUpdate(payload._id, payload, { new: true })
      .exec()
  }

  async delete(_id: Types.ObjectId): Promise<Model<Document>> {
    await this.checkPermissons({ action: Action.Delete, resourceId: _id })
    return this.dbModel.findByIdAndDelete(_id).exec()
  }

  // Follower cache counter ----------

  async increaseFollowingCount(_id: Types.ObjectId): Promise<Model<Document>> {
    return this.dbModel
      .findByIdAndUpdate({ _id }, { $inc: { followerCounter: 1 } })
      .exec()
  }

  async decreaseFollowingCount(_id: Types.ObjectId): Promise<Model<Document>> {
    return this.dbModel
      .findByIdAndUpdate({ _id }, { $inc: { followerCounter: -1 } })
      .exec()
  }

  // Pagination

  async list(filters?: any, paginationArgs?: PaginationArgs) {
    const { first, after, before } = paginationArgs
    const limit = first ?? 0

    filters = filters ?? {}
    const options = {}

    if (first) {
      // In order to check if there is a next page, fetch one extra record
      options['limit'] = first + 1
    }

    // 'before' and 'after' are mutually exclusive. Because of this:
    if (after) {
      const afterDate = new Date(fromCursorHash(after))
      filters['createdAt'] = { $gt: afterDate.toISOString() }
    } else if (before) {
      const beforeDate = new Date(fromCursorHash(before))
      filters['createdAt'] = { $lt: beforeDate.toISOString() }
    }
    const result = await this.dbModel.find(filters, null, options).exec()
    let hasNextPage = false // Default behavior for empty result
    if (result?.length > 0) {
      hasNextPage = result.length === first + 1
    }

    // Build PaginatedSchool
    if (hasNextPage && first > 0) {
      result.pop()
    }
    return {
      edges: result.map((doc) => {
        return {
          node: doc,
          cursor: doc.cursor,
        }
      }),
      totalCount: result?.length,
      pageInfo: {
        endCursor: result[result.length - 1]?.cursor,

        hasNextPage,
      },
    }
  }
}
