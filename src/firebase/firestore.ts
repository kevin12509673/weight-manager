import { until } from '@open-draft/until'
import {
  getFirestore, doc, setDoc, getDoc,
} from 'firebase/firestore'
import { DateTime } from 'luxon'
import { DailyRecord, MonthlyRecord } from '@/types/records'
import { getIsAuthenticated, auth } from './auth'

const db = getFirestore()

const getMonthlyRecord = async (dateTime: DateTime): Promise<MonthlyRecord> => {
  const isAuthenticatedResult = await until(() => getIsAuthenticated())
  if (isAuthenticatedResult.error) throw isAuthenticatedResult.error
  if (auth.currentUser == null) throw new Error('User not logged in or not exist')

  const year = dateTime.year.toString()
  const month = dateTime.month.toString()

  const docRef = doc(db, 'users', auth.currentUser.uid, year, month)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) return {}

  return docSnap.data()
}

const updateDailyRecord = async (dateTime: DateTime, dailyRecord: DailyRecord) => {
  const isAuthenticatedResult = await until(() => getIsAuthenticated())
  if (isAuthenticatedResult.error) throw isAuthenticatedResult.error
  if (auth.currentUser == null) throw new Error('User not logged in or not exist')

  const year = dateTime.year.toString()
  const month = dateTime.month.toString()
  const day = dateTime.day.toString()

  const docRef = doc(db, 'users', auth.currentUser.uid, year, month)
  const result = await until(() => setDoc(docRef, { [day]: dailyRecord }, { merge: true }))
  if (result.error) throw result.error
}

export {
  getMonthlyRecord,
  updateDailyRecord,
}
