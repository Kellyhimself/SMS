import { openDB, DBSchema, IDBPDatabase } from 'idb'

export interface SchoolDB extends DBSchema {
  students: {
    key: string
    value: {
      id: string
      name: string
      class: string
      parent_phone: string
      parent_email: string | null
      school_id: string
      admission_number: string | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string }
  }
  fees: {
    key: string
    value: {
      id: string
      student_id: string
      school_id: string
      amount: number
      amount_paid: number | null
      date: string
      due_date: string | null
      status: string
      description: string | null
      payment_method: string | null
      payment_reference: string | null
      payment_date: string | null
      receipt_url: string | null
      payment_details: Record<string, unknown> | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
      term: string | null
      academic_year: string | null
      fee_type: string | null
      student_admission_number: string | null
      student_name: string | null
    }
    indexes: { 'by-school': string; 'by-student': string }
  }
  schools: {
    key: string
    value: {
      id: string
      name: string
      address: string | null
      email: string
      subscription_plan: string
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
      phone: string | null
      bank_api_settings: Record<string, unknown> | null
      payment_settings: Record<string, unknown> | null
    }
  }
  exams: {
    key: string
    value: {
      id: string
      student_id: string
      school_id: string
      subject: string
      exam_type: string
      date: string
      score: number
      total_marks: number
      passing_marks: number
      grade: string
      term: string
      academic_year: string
      remarks: string | null
      teacher_remarks: string | null
      principal_remarks: string | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string; 'by-student': string; 'by-exam': string }
  }
  report_cards: {
    key: string
    value: {
      id: string
      student_id: string | null
      school_id: string
      exam_id: string | null
      term: string
      academic_year: string
      grade: string
      total_marks: number
      average_marks: number
      class_position: number | null
      teacher_remarks: string | null
      principal_remarks: string | null
      parent_signature: boolean | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string; 'by-student': string }
  }
  receipts: {
    key: string
    value: {
      id: string
      blob: Blob
      fee_id: string
      created_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-fee': string }
  }
  notifications: {
    key: string
    value: {
      id: string
      type: 'sms' | 'email' | 'whatsapp'
      message: string
      recipient_email?: string | null
      recipient_phone?: string | null
      status: 'pending' | 'sent' | 'failed'
      error_message?: string
      school_id: string
      sent_at?: string | null
      created_at: string
      updated_at: string
      sync_status: 'pending' | 'synced'
    }
    indexes: {
      'by-school': string
    }
  }
  sync_queue: {
    key: string
    value: {
      id: string
      table_name: string
      record_id: string
      operation: 'create' | 'update' | 'delete'
      data: string
      created_at: string
      status: 'pending' | 'processing' | 'completed' | 'failed'
    }
  }
  auth_state: {
    key: string
    value: {
      id: string
      user_id: string
      school_id: string
      email: string
      name: string
      role: string
      created_at: string
      updated_at: string
      last_sync_at: string
      session: {
        access_token: string
        refresh_token: string
        expires_at: number
      }
      school: {
        id: string
        name: string
        email: string
        subscription_plan: string
        created_at: string
        updated_at: string
      }
    }
  }
  offline_credentials: {
    key: string
    value: {
      id: string
      email: string
      password_hash: string
      created_at: string
      updated_at: string
    }
  }
  tanstack_cache: {
    key: string
    value: Record<string, unknown>
  }
}

let db: IDBPDatabase<SchoolDB> | null = null

export async function getDB() {
  if (db) return db

  db = await openDB<SchoolDB>('school-db', 4, {
    upgrade(database, oldVersion, newVersion) {
      console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`)
      
      // Create students store
      if (!database.objectStoreNames.contains('students')) {
        const studentsStore = database.createObjectStore('students', { keyPath: 'id' })
        studentsStore.createIndex('by-school', 'school_id')
      }

      // Create fees store
      if (!database.objectStoreNames.contains('fees')) {
        const feesStore = database.createObjectStore('fees', { keyPath: 'id' })
        feesStore.createIndex('by-school', 'school_id')
        feesStore.createIndex('by-student', 'student_id')
      }

      // Create schools store
      if (!database.objectStoreNames.contains('schools')) {
        database.createObjectStore('schools', { keyPath: 'id' })
      }

      // Create exams store
      if (!database.objectStoreNames.contains('exams')) {
        const examsStore = database.createObjectStore('exams', { keyPath: 'id' })
        examsStore.createIndex('by-school', 'school_id')
        examsStore.createIndex('by-student', 'student_id')
        examsStore.createIndex('by-exam', 'exam_id')
      }

      // Create report cards store
      if (!database.objectStoreNames.contains('report_cards')) {
        const reportCardsStore = database.createObjectStore('report_cards', { keyPath: 'id' })
        reportCardsStore.createIndex('by-school', 'school_id')
        reportCardsStore.createIndex('by-student', 'student_id')
      }

      // Create receipts store
      if (!database.objectStoreNames.contains('receipts')) {
        const receiptsStore = database.createObjectStore('receipts', { keyPath: 'id' })
        receiptsStore.createIndex('by-fee', 'fee_id')
      }

      // Create notifications store
      if (!database.objectStoreNames.contains('notifications')) {
        const notificationsStore = database.createObjectStore('notifications', { keyPath: 'id' })
        notificationsStore.createIndex('by-school', 'school_id')
      }

      // Create sync queue store
      if (!database.objectStoreNames.contains('sync_queue')) {
        database.createObjectStore('sync_queue', { keyPath: 'id' })
      }

      // Create auth state store
      if (!database.objectStoreNames.contains('auth_state')) {
        database.createObjectStore('auth_state', { keyPath: 'id' })
      }

      // Create offline credentials store
      if (!database.objectStoreNames.contains('offline_credentials')) {
        database.createObjectStore('offline_credentials', { keyPath: 'id' })
      }

      // Create tanstack cache store
      if (!database.objectStoreNames.contains('tanstack_cache')) {
        database.createObjectStore('tanstack_cache', { keyPath: 'id' })
      }
    },
  })

  return db
}

export async function clearDB() {
  const database = await getDB()
  await database.clear('students')
  await database.clear('fees')
  await database.clear('schools')
  await database.clear('exams')
  await database.clear('report_cards')
  await database.clear('receipts')
  await database.clear('notifications')
  await database.clear('sync_queue')
  await database.clear('auth_state')
  await database.clear('offline_credentials')
  await database.clear('tanstack_cache')
} 