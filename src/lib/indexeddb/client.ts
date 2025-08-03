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
  fee_types: {
    key: string
    value: {
      id: string
      school_id: string
      name: string
      description: string | null
      is_active: boolean
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string }
  }
  installment_plans: {
    key: string
    value: {
      id: string
      fee_id: string
      total_amount: number
      installment_count: number
      installment_amount: number
      start_date: string
      end_date: string
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-fee': string }
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
  attendance: {
    key: string
    value: {
      id: string
      student_id: string
      school_id: string
      date: string
      status: 'present' | 'absent' | 'late' | 'excused'
      remarks?: string | null
      recorded_by?: string | null
      created_at: string
      updated_at: string
      sync_status: 'pending' | 'synced'
      // Joined fields for offline queries
      student_name?: string | null
      student_admission_number?: string | null
      class?: string | null
      recorded_by_name?: string | null
    }
    indexes: { 
      'by-school': string
      'by-student': string
      'by-date': string
      'by-school-date': string
    }
  }
  parent_accounts: {
    key: string
    value: {
      id: string
      phone: string
      email: string | null
      name: string
      school_id: string
      is_active: boolean
      created_at: string
      updated_at: string
      sync_status: 'pending' | 'synced'
    }
    indexes: { 
      'by-school': string
      'by-phone': string
    }
  }
  parent_student_links: {
    key: string
    value: {
      id: string
      parent_id: string
      student_id: string
      relationship: string
      is_primary: boolean
      created_at: string
      updated_at: string
      sync_status: 'pending' | 'synced'
      // Joined fields for offline queries
      parent_name?: string | null
      parent_phone?: string | null
      parent_email?: string | null
      student_name?: string | null
      student_admission_number?: string | null
      class?: string | null
    }
    indexes: { 
      'by-parent': string
      'by-student': string
      'by-primary': string
    }
  }
  parent_sessions: {
    key: string
    value: {
      id: string
      parent_id: string
      phone: string
      supabase_user_id?: string
      created_at: string
      expires_at: string
    }
  }
  sync_queue: {
    key: string
    value: {
      id: string
      table: string
      operation: 'create' | 'update' | 'delete'
      record_id: string
      data: any
      created_at: string
      retry_count: number
    }
    indexes: { 'by-table': string; 'by-created': string }
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
        verification_status: string
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
  users: {
    key: string
    value: {
      id: string
      email: string
      name: string
      role: string
      school_id: string | null
      created_at: string
      updated_at: string
      sync_status: 'synced' | 'pending'
    }
    indexes: { 'by-school': string }
  }
}

let db: IDBPDatabase<SchoolDB> | null = null

export async function getDB() {
  if (db) {
    console.log('📦 Using existing database connection')
    return db
  }

  console.log('📦 Opening IndexedDB connection...')
  db = await openDB<SchoolDB>('school-db', 6, {
    upgrade(database, oldVersion, newVersion) {
      console.log(`🔧 Upgrading database from version ${oldVersion} to ${newVersion}`)
      
      // Create students store
      if (!database.objectStoreNames.contains('students')) {
        console.log('📦 Creating students object store')
        const studentsStore = database.createObjectStore('students', { keyPath: 'id' })
        studentsStore.createIndex('by-school', 'school_id')
      }

      // Create fees store
      if (!database.objectStoreNames.contains('fees')) {
        console.log('📦 Creating fees object store')
        const feesStore = database.createObjectStore('fees', { keyPath: 'id' })
        feesStore.createIndex('by-school', 'school_id')
        feesStore.createIndex('by-student', 'student_id')
      }

      // Create fee types store
      if (!database.objectStoreNames.contains('fee_types')) {
        console.log('📦 Creating fee_types object store')
        const feeTypesStore = database.createObjectStore('fee_types', { keyPath: 'id' })
        feeTypesStore.createIndex('by-school', 'school_id')
      }

      // Create installment plans store
      if (!database.objectStoreNames.contains('installment_plans')) {
        console.log('📦 Creating installment_plans object store')
        const installmentPlansStore = database.createObjectStore('installment_plans', { keyPath: 'id' })
        installmentPlansStore.createIndex('by-fee', 'fee_id')
      }

      // Create schools store
      if (!database.objectStoreNames.contains('schools')) {
        console.log('📦 Creating schools object store')
        database.createObjectStore('schools', { keyPath: 'id' })
      }

      // Create exams store
      if (!database.objectStoreNames.contains('exams')) {
        console.log('📦 Creating exams object store')
        const examsStore = database.createObjectStore('exams', { keyPath: 'id' })
        examsStore.createIndex('by-school', 'school_id')
        examsStore.createIndex('by-student', 'student_id')
        examsStore.createIndex('by-exam', 'exam_id')
      }

      // Create report cards store
      if (!database.objectStoreNames.contains('report_cards')) {
        console.log('📦 Creating report_cards object store')
        const reportCardsStore = database.createObjectStore('report_cards', { keyPath: 'id' })
        reportCardsStore.createIndex('by-school', 'school_id')
        reportCardsStore.createIndex('by-student', 'student_id')
      }

      // Create receipts store
      if (!database.objectStoreNames.contains('receipts')) {
        console.log('📦 Creating receipts object store')
        const receiptsStore = database.createObjectStore('receipts', { keyPath: 'id' })
        receiptsStore.createIndex('by-fee', 'fee_id')
      }

      // Create notifications store
      if (!database.objectStoreNames.contains('notifications')) {
        console.log('📦 Creating notifications object store')
        const notificationsStore = database.createObjectStore('notifications', { keyPath: 'id' })
        notificationsStore.createIndex('by-school', 'school_id')
      }

      // Create attendance store
      if (!database.objectStoreNames.contains('attendance')) {
        console.log('📦 Creating attendance object store')
        const attendanceStore = database.createObjectStore('attendance', { keyPath: 'id' })
        attendanceStore.createIndex('by-school', 'school_id')
        attendanceStore.createIndex('by-student', 'student_id')
        attendanceStore.createIndex('by-date', 'date')
        attendanceStore.createIndex('by-school-date', 'school_id')
      }

      // Create parent accounts store
      if (!database.objectStoreNames.contains('parent_accounts')) {
        console.log('📦 Creating parent_accounts object store')
        const parentAccountsStore = database.createObjectStore('parent_accounts', { keyPath: 'id' })
        parentAccountsStore.createIndex('by-school', 'school_id')
        parentAccountsStore.createIndex('by-phone', 'phone')
      }

      // Create parent student links store
      if (!database.objectStoreNames.contains('parent_student_links')) {
        console.log('📦 Creating parent_student_links object store')
        const parentStudentLinksStore = database.createObjectStore('parent_student_links', { keyPath: 'id' })
        parentStudentLinksStore.createIndex('by-parent', 'parent_id')
        parentStudentLinksStore.createIndex('by-student', 'student_id')
        parentStudentLinksStore.createIndex('by-primary', 'is_primary')
      }

      // Create parent sessions store
      if (!database.objectStoreNames.contains('parent_sessions')) {
        console.log('📦 Creating parent_sessions object store')
        database.createObjectStore('parent_sessions', { keyPath: 'id' })
      }

      // Create sync queue store
      if (!database.objectStoreNames.contains('sync_queue')) {
        console.log('📦 Creating sync_queue object store')
        const syncQueueStore = database.createObjectStore('sync_queue', { keyPath: 'id' })
        syncQueueStore.createIndex('by-table', 'table')
        syncQueueStore.createIndex('by-created', 'created_at')
      }

      // Create auth state store
      if (!database.objectStoreNames.contains('auth_state')) {
        console.log('📦 Creating auth_state object store')
        database.createObjectStore('auth_state', { keyPath: 'id' })
      }

      // Create offline credentials store
      if (!database.objectStoreNames.contains('offline_credentials')) {
        console.log('📦 Creating offline_credentials object store')
        database.createObjectStore('offline_credentials', { keyPath: 'id' })
      }

      // Create tanstack cache store
      if (!database.objectStoreNames.contains('tanstack_cache')) {
        console.log('📦 Creating tanstack_cache object store')
        database.createObjectStore('tanstack_cache', { keyPath: 'id' })
      }

      // Create users store
      if (!database.objectStoreNames.contains('users')) {
        console.log('📦 Creating users object store')
        const usersStore = database.createObjectStore('users', { keyPath: 'id' })
        usersStore.createIndex('by-school', 'school_id')
      }
      
      console.log('✅ Database upgrade completed successfully')
    },
  })

  return db
}

export async function clearDB() {
  const database = await getDB()
  await database.clear('students')
  await database.clear('fees')
  await database.clear('fee_types')
  await database.clear('installment_plans')
  await database.clear('schools')
  await database.clear('exams')
  await database.clear('report_cards')
  await database.clear('receipts')
  await database.clear('notifications')
  await database.clear('attendance')
  await database.clear('parent_accounts')
  await database.clear('parent_student_links')
  await database.clear('sync_queue')
  await database.clear('auth_state')
  await database.clear('offline_credentials')
  await database.clear('tanstack_cache')
  await database.clear('users')
} 