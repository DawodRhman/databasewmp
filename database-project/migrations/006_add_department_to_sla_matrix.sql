-- Migration: Add department_id to efiling_sla_matrix
-- Purpose: Allow SLA Matrix entries to be department-specific
-- Date: 2025-12-18

-- Add department_id column to efiling_sla_matrix
ALTER TABLE public.efiling_sla_matrix
ADD COLUMN IF NOT EXISTS department_id INTEGER NULL;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'efiling_sla_matrix_department_id_fkey') THEN
        ALTER TABLE public.efiling_sla_matrix
        ADD CONSTRAINT efiling_sla_matrix_department_id_fkey
        FOREIGN KEY (department_id) REFERENCES public.efiling_departments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for department filtering
CREATE INDEX IF NOT EXISTS idx_efiling_sla_matrix_department 
ON public.efiling_sla_matrix(department_id);

-- Add comment
COMMENT ON COLUMN public.efiling_sla_matrix.department_id IS 'Optional department ID for department-specific SLA matrix entries. NULL for global entries.';

