import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'

import { SchoolService } from './school.service'
import { School, SchoolSchema } from './school.model'
import { SchoolResolver } from './school.resolver'

import { Subject, SubjectSchema } from '../subject/subject.model'
import { SubjectService } from '../subject/subject.service'

import { User, UserSchema } from '../user/user.model'
import { UserService } from '../user/user.service'
import { UserResolver } from '../user/user.resolver'

import { Calendar, CalendarSchema } from '../calendar/calendar.model'
import { CalendarService } from '../calendar/calendar.service'

import {
  CalendarEvent,
  CalendarEventSchema,
} from '../calendarEvent/calendarEvent.model'
import { CalendarEventService } from '../calendarEvent/calendarEvent.service'

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: School.name,
        schema: SchoolSchema,
      },
      {
        name: Subject.name,
        schema: SubjectSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Calendar.name,
        schema: CalendarSchema,
      },
      {
        name: CalendarEvent.name,
        schema: CalendarEventSchema,
      },
    ]),
  ],
  //   controllers: [SchoolsController],
  providers: [
    SchoolService,
    SchoolResolver,
    SubjectService,
    CalendarService,
    CalendarEventService,
    UserService,
    UserResolver,
  ],
})
export class SchoolModule {}
