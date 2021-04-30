import * as DB from '@nestjs/mongoose' // { Prop, Schema, SchemaFactory }
import * as GQL from '@nestjs/graphql' // { Field, ObjectType, ID }
import mongoose from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import * as Utils from '../../utils/Model'
import * as V from 'class-validator' // { Prop, Schema, SchemaFactory }

// Pagination
import { Connected, ConnectionType, withCursor } from '../../utils/Connection'

// Entities
import { Subject } from '../subject/subject.model'
import { CalendarEvent } from '../calendarEvent/calendarEvent.model'
import { User, ConnectedUsers } from '../user/user.model'

// Embedded documents
import { Comment, CommentSchema } from '../comment/comment.model'

@GQL.ObjectType()
@DB.Schema({
  autoIndex: true,
  timestamps: true,
})
export class Discussion extends Utils.BaseModel {
  constructor(subject: Subject) {
    super()
    this.subject = subject
  }

  @GQL.Field(() => GQL.ID)
  _id: mongoose.Types.ObjectId

  @GQL.Field(() => String, { nullable: true })
  @DB.Prop(() => String)
  title: string

  @GQL.Field(() => String, { nullable: true })
  @DB.Prop(() => String)
  content: string

  /*
   * References for subdocuments in decorators:
   * https://stackoverflow.com/questions/62704600/mongoose-subdocuments-in-nest-js
   * https://www.javaer101.com/en/article/40315274.html
   */
  @GQL.Field(() => [Comment], { nullable: true })
  @DB.Prop({
    type: [CommentSchema],
    required: false,
    default: [],
  })
  comments: Comment[]

  /*
   *  Relations
   */

  @GQL.Field(() => Subject, { nullable: false })
  @DB.Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
    autopopulate: true,
  })
  subject: mongoose.Types.ObjectId | Subject
}

export type DiscussionDocument = Discussion & mongoose.Document
export const DiscussionSchema = withCursor(Discussion.schema)
DiscussionSchema.plugin(autopopulate)

@GQL.ObjectType()
export class ConnectedDiscussions extends Connected(Discussion) {}
