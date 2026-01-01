#!/bin/bash

# Script to help run Supabase migrations
# This script combines both migration files for easy copy-paste

echo "=========================================="
echo "Supabase Migration Script"
echo "=========================================="
echo ""
echo "This script will display the migration SQL."
echo "Copy and paste it into your Supabase SQL Editor."
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "=========================================="
echo "MIGRATION 1: Initial Schema"
echo "=========================================="
echo ""
cat supabase/migrations/001_initial_schema.sql

echo ""
echo ""
echo "=========================================="
echo "MIGRATION 2: RLS Policies"
echo "=========================================="
echo ""
cat supabase/migrations/002_rls_policies.sql

echo ""
echo ""
echo "=========================================="
echo "Done! Copy the SQL above into Supabase SQL Editor"
echo "=========================================="

