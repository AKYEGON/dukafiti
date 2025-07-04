const { createClient }  =  require('@supabase/supabase-js');
;
const supabaseUrl  =  process.env.SUPABASE_URL || 'postgresql://postgres:alvinkibet@db.kwdzbssuovwemthmiuht.supabase.co:5432/postgres';
const supabaseServiceKey  =  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3ZHpic3N1b3Z3ZW10aG1pdWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTU0MTIwNiwiZXhwIjoyMDY3MTE3MjA2fQ.zSvksJ4fZLhaXKs8Ir_pq-yse-8x1NTKFTCWdiSLweQ';

module.exports  =  createClient(supabaseUrl, supabaseServiceKey);