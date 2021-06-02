import { Injectable, Inject } from '@nestjs/common'
import { CONTEXT } from '@nestjs/graphql'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { plainToClass } from 'class-transformer'

// CalendarEvent
import { CalendarEvent, CalendarEventDocument } from './calendarEvent.model'
import {
  CreateCalendarEventInput,
  ListCalendarEventsInput,
  UpdateCalendarEventInput,
} from './calendarEvent.inputs'

// Subject
import { Subject, SubjectDocument } from '../subject/subject.model'

// Auth
import { Action } from '../../casl/casl-ability.factory'

// Utils
import { BaseService } from '../../utils/BaseService'
import { parseEndDate } from '../../utils/RRuleParsing'

const MODEL_CLASS = CalendarEvent
@Injectable()
export class CalendarEventService extends BaseService<CalendarEvent> {
  modelClass = MODEL_CLASS
  dbModel: Model<CalendarEventDocument>
  context

  constructor(
    @InjectModel(CalendarEvent.name)
    dbModel: Model<CalendarEventDocument>,
    @InjectModel(Subject.name)
    private subjectModel: Model<SubjectDocument>,
    @Inject(CONTEXT) context,

    // private calendarEventService: CalendarEventService,
  ) {
    super()
    this.dbModel = dbModel
    this.context = context
  }

  async create(payload: CreateCalendarEventInput) {
    const doc: SubjectDocument = await this.subjectModel
      .findById(payload.subject)
      .exec()
    const model: Subject = plainToClass(Subject, doc.toObject())
    const record: CalendarEvent = new CalendarEvent(model)

    await this.checkPermissons({
      action: Action.Create,
      record,
    })

    /*
     *  If able to create calendarEvent, compute endDate from RRULE (if present)
     */
    if (payload.rrule) {
      payload.endDateUtc = parseEndDate(payload.startDateUtc, payload.rrule)
    } else {
      payload.endDateUtc = payload.startDateUtc
    }
    return await this.dbModel.create(payload)
  }

  async search(filters: ListCalendarEventsInput, connectionArgs) {
    /*
     * Naming according to MongoDB documentation:
     * https://docs.mongodb.com/manual/reference/method/db.collection.find/#mongodb-method-db.collection.find
     *
     */
    const query: TListQuery = this.buildListQuery(filters)
    return this.list(query, connectionArgs)
  }

  buildListQuery(filters: ListCalendarEventsInput): TListQuery {
    const conditions: TListCondition[] = []

    if (filters?.subject) {
      conditions.push({ subject: filters.subject })
    }
    if (filters?.rangeStart) {
      conditions.push({ endDateUtc: { $gte: filters.rangeStart } })
    }
    if (filters?.rangeEnd) {
      conditions.push({ startDateUtc: { $lte: filters.rangeEnd } })
    }

    /* If no conditions are passed, return null */
    if (conditions.length > 0) {
      return { $and: conditions }
    }
    return null
  }
}

type TListCondition =
  | { subject: Types.ObjectId }
  | { startDateUtc: { $lte: Date } }
  | { endDateUtc: { $gte: Date } }

type TListQuery = {
  $and?: TListCondition[]
} | null
