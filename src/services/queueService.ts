import { supabase } from '../config/supabase';

export interface Job {
  id: string;
  jobType: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledFor: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export type JobType = 
  | 'send_email'
  | 'generate_pdf'
  | 'send_move_reminder'
  | 'send_invoice_reminder'
  | 'send_quote_followup'
  | 'process_image'
  | 'sync_calendar'
  | 'export_data'
  | 'import_data'
  | 'aggregate_analytics';

class QueueService {
  // Enqueue a new job
  async enqueueJob(
    jobType: JobType,
    payload: any,
    options: {
      scheduledFor?: Date;
      maxAttempts?: number;
      priority?: 'low' | 'normal' | 'high';
    } = {}
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('enqueue_job', {
        p_job_type: jobType,
        p_payload: payload,
        p_scheduled_for: options.scheduledFor?.toISOString() || new Date().toISOString()
      });

      if (error) throw error;
      
      console.log(`📋 Job enqueued: ${jobType}`, data);
      return data;
    } catch (error) {
      console.error('Error enqueueing job:', error);
      throw error;
    }
  }

  // Enqueue email job
  async enqueueEmail(to: string, subject: string, body: string, customerId?: string) {
    return this.enqueueJob('send_email', {
      to,
      subject,
      body,
      customerId,
      timestamp: new Date().toISOString()
    });
  }

  // Enqueue PDF generation
  async enqueuePDFGeneration(
    type: 'quote' | 'invoice' | 'arbeitsschein',
    documentId: string,
    customerId: string
  ) {
    return this.enqueueJob('generate_pdf', {
      type,
      documentId,
      customerId,
      timestamp: new Date().toISOString()
    });
  }

  // Schedule move reminder
  async scheduleMoveReminder(customerId: string, movingDate: Date) {
    // Schedule for 3 days before move
    const reminderDate = new Date(movingDate);
    reminderDate.setDate(reminderDate.getDate() - 3);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM

    return this.enqueueJob(
      'send_move_reminder',
      { customerId, movingDate: movingDate.toISOString() },
      { scheduledFor: reminderDate }
    );
  }

  // Get pending jobs
  async getPendingJobs(limit: number = 10): Promise<Job[]> {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return this.mapJobs(data || []);
    } catch (error) {
      console.error('Error fetching pending jobs:', error);
      return [];
    }
  }

  // Get job by ID
  async getJob(jobId: string): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data ? this.mapJob(data) : null;
    } catch (error) {
      console.error('Error fetching job:', error);
      return null;
    }
  }

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: 'processing' | 'completed' | 'failed',
    errorMessage?: string
  ) {
    try {
      const updates: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'processing') {
        updates.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      } else if (status === 'failed' && errorMessage) {
        updates.error_message = errorMessage;
      }

      const { error } = await supabase
        .from('job_queue')
        .update(updates)
        .eq('id', jobId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  }

  // Process a single job (to be called by Edge Function or worker)
  async processJob(job: Job): Promise<void> {
    console.log(`🔄 Processing job ${job.id} of type ${job.jobType}`);
    
    try {
      // Update status to processing
      await this.updateJobStatus(job.id, 'processing');

      // Process based on job type
      switch (job.jobType) {
        case 'send_email':
          await this.processSendEmail(job);
          break;
        case 'generate_pdf':
          await this.processGeneratePDF(job);
          break;
        case 'send_move_reminder':
          await this.processMoveReminder(job);
          break;
        case 'send_invoice_reminder':
          await this.processInvoiceReminder(job);
          break;
        case 'send_quote_followup':
          await this.processQuoteFollowup(job);
          break;
        default:
          throw new Error(`Unknown job type: ${job.jobType}`);
      }

      // Mark as completed
      await this.updateJobStatus(job.id, 'completed');
      console.log(`✅ Job ${job.id} completed successfully`);
    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed:`, error);
      await this.updateJobStatus(job.id, 'failed', error.message);
      
      // Re-enqueue if attempts remaining
      if (job.attempts < job.maxAttempts - 1) {
        const nextAttempt = new Date();
        nextAttempt.setMinutes(nextAttempt.getMinutes() + Math.pow(2, job.attempts) * 5); // Exponential backoff
        
        await this.enqueueJob(
          job.jobType as JobType,
          job.payload,
          { 
            scheduledFor: nextAttempt,
            maxAttempts: job.maxAttempts - job.attempts
          }
        );
      }
    }
  }

  // Job processors
  private async processSendEmail(job: Job) {
    // This would integrate with your email service
    console.log('Processing email job:', job.payload);
    // Implementation would go here
  }

  private async processGeneratePDF(job: Job) {
    // This would integrate with your PDF generation service
    console.log('Processing PDF generation:', job.payload);
    // Implementation would go here
  }

  private async processMoveReminder(job: Job) {
    // Send move reminder email
    const { customerId, movingDate } = job.payload;
    console.log(`Sending move reminder to customer ${customerId} for ${movingDate}`);
    // Implementation would go here
  }

  private async processInvoiceReminder(job: Job) {
    // Send invoice reminder email
    console.log('Processing invoice reminder:', job.payload);
    // Implementation would go here
  }

  private async processQuoteFollowup(job: Job) {
    // Send quote follow-up email
    console.log('Processing quote follow-up:', job.payload);
    // Implementation would go here
  }

  // Get job statistics
  async getJobStats() {
    try {
      const { data, error } = await supabase
        .from('job_queue')
        .select('status, job_type')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        byType: {} as Record<string, number>
      };

      data?.forEach(job => {
        stats[job.status as keyof typeof stats]++;
        stats.byType[job.job_type] = (stats.byType[job.job_type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return null;
    }
  }

  // Clean up old jobs
  async cleanupOldJobs(daysToKeep: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('job_queue')
        .delete()
        .in('status', ['completed', 'failed'])
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      console.log('✅ Old jobs cleaned up');
    } catch (error) {
      console.error('Error cleaning up jobs:', error);
    }
  }

  // Map database records to Job type
  private mapJob(data: any): Job {
    return {
      id: data.id,
      jobType: data.job_type,
      payload: data.payload,
      status: data.status,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      scheduledFor: new Date(data.scheduled_for),
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorMessage: data.error_message
    };
  }

  private mapJobs(data: any[]): Job[] {
    return data.map(item => this.mapJob(item));
  }
}

// Export singleton instance
export const queueService = new QueueService();