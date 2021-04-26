import * as DB from '@nestjs/mongoose' // { Prop, Schema, SchemaFactory }
import * as GQL from '@nestjs/graphql' // { Field, ObjectType, ID }
import mongoose from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import * as Utils from '../../utils/Model'

// Pagination
import { Connected, ConnectionType, withCursor } from '../../utils/Connection'

// Entities
import { School } from '../school/school.model'
import { Subject, ConnectedSubjects } from '../subject/subject.model'
import { User, ConnectedUsers } from '../user/user.model'

@GQL.ObjectType()
@DB.Schema({
  timestamps: true,
  // autoIndex: true
})
export class Institute extends Utils.BaseModel {
  constructor(school?: School) {
    super()
    this.school = school
  }

  @GQL.Field(() => GQL.ID)
  _id: mongoose.Types.ObjectId

  @GQL.Field(() => String)
  @DB.Prop()
  name: string

  @GQL.Field(() => String)
  @DB.Prop()
  shortName: string

  @GQL.Field(() => User, { nullable: false })
  @DB.Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    autopopulate: true,
  })
  createdBy: mongoose.Types.ObjectId | User

  /*
   *  Relations
   */

  @GQL.Field(() => GQL.Int)
  @DB.Prop({ type: Number, default: 0 })
  followerCounter: number

  @GQL.Field(() => School, { nullable: true })
  @DB.Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    autopopulate: true,
  })
  school: mongoose.Types.ObjectId | School

  /*
   *  Connections
   */

  @GQL.Field(() => ConnectedSubjects, { nullable: true })
  subjectsConnection: ConnectionType<Subject>

  @GQL.Field(() => ConnectedUsers, { nullable: true })
  usersFollowerConnection: ConnectionType<User>
}

export type InstituteDocument = Institute & mongoose.Document
export const InstituteSchema = withCursor(Institute.schema)
InstituteSchema.plugin(autopopulate)
@GQL.ObjectType()
export class ConnectedInstitutes extends Connected(Institute) {}
