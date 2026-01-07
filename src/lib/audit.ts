import { supabase } from './supabase'

export async function logAuditAction(action: string, tableName: string, recordId?: string, details?: any) {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        await supabase.from('audit_logs').insert([
            {
                user_id: user.id,
                action,
                table_name: tableName,
                record_id: recordId,
                details
            }
        ])
    } catch (error) {
        console.error('Error logging audit action:', error)
    }
}
