# Docker Backend Container Fix Documentation

## Problem Summary

The backend container was repeatedly shutting down when running with `docker-compose up`. This document details the bugs identified and the fixes applied to resolve the issue.

## Bugs Identified and Fixes Applied

### 1. Volume Mount Overwriting Container Files

**Bug**: The original `docker-compose.yml` had a volume mount `./backend:/rails` that was overwriting the container's `/rails` directory, including:
- Pre-installed gems
- The entrypoint script
- All bin scripts

**Fix**: Changed the volume mount to only mount the gems directory:
```yaml
# Before
volumes:
  - ./backend:/rails
  - backend_gems:/usr/local/bundle

# After
volumes:
  - backend_gems:/rails/vendor/bundle
```

### 2. Missing libyaml-dev Dependency

**Bug**: The Dockerfile was missing the `libyaml-dev` package, causing the `psych` gem to fail during compilation with the error:
```
yaml.h not found
*** extconf.rb failed ***
```

**Fix**: Added `libyaml-dev` to the apt-get install command in `backend/Dockerfile`:
```dockerfile
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential ca-certificates default-mysql-client default-libmysqlclient-dev git libyaml-dev && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives
```

### 3. Windows Line Endings (CRLF) in Scripts

**Bug**: The bin scripts (including `docker-entrypoint` and `rails`) had Windows-style CRLF line endings (`\r\n`). This caused the shebang line to be interpreted as `#!/bin/bash\r` which doesn't exist on Linux.

Error messages:
```
/bin/bash: -: invalid option
/usr/bin/env: 'ruby\r': No such file or directory
```

**Fix**: Added a sed command in the Dockerfile to convert all bin scripts to Unix line endings:
```dockerfile
RUN sed -i 's/\r$//' /rails/bin/* && chmod +x /rails/bin/*
```

### 4. Entrypoint Script Not Executable

**Bug**: The entrypoint script didn't have execute permissions.

**Fix**: Added `chmod +x /rails/bin/*` in the Dockerfile (combined with the sed command above).

### 5. Entrypoint Script Argument Handling

**Bug**: The original entrypoint script used relative paths (`rails`) which weren't found in the PATH, and had issues with argument handling.

**Fix**: Updated `backend/bin/docker-entrypoint` to:
- Use absolute paths (`/rails/bin/rails`)
- Add proper argument handling with `exec -- "$@"`
- Add database wait logic

```bash
#!/bin/bash

set -e

# Enable jemalloc for reduced memory usage and latency.
if [ -z "${LD_PRELOAD+x}" ] && [ -f /usr/lib/*/libjemalloc.so.2 ]; then
  export LD_PRELOAD="$(echo /usr/lib/*/libjemalloc.so.2)"
fi

# Wait for database to be ready
if [ "${DATABASE_HOST:-}" != "" ]; then
  echo "Waiting for database at $DATABASE_HOST..."
  while ! /usr/bin/mysqladmin ping -h "$DATABASE_HOST" -u "$DATABASE_USERNAME" -p"$DATABASE_PASSWORD" --wait=30 > /dev/null 2>&1; do
    sleep 1
  done
  echo "Database is ready!"
fi

# If running the rails server then create or migrate existing database
if [ "${1}" = "rails" ] && [ "${2}" = "server" ]; then
  /rails/bin/rails db:prepare
fi

# Execute the command with proper argument handling
if [ $# -eq 0 ]; then
  exec /rails/bin/rails server -b 0.0.0.0
else
  exec "$@"
fi
```

### 6. Database Connection Credentials

**Bug**: The docker-compose.yml was using `expense_user/expense_password` but the Rails application was having connection issues with this user due to MySQL 8 authentication plugin differences.

**Fix**: Changed the database credentials in `docker-compose.yml` to use root:
```yaml
environment:
  RAILS_ENV: development
  DATABASE_HOST: db
  DATABASE_PORT: 3306
  DATABASE_NAME: expense_system_development
  DATABASE_USERNAME: root
  DATABASE_PASSWORD: rootpassword
```

### 7. Schema.rb Force Cascade Issue

**Bug**: The `schema.rb` file had `force: :cascade` on table definitions, which caused foreign key constraint errors when the database already had tables from the init.sql script.

**Fix**: Removed `force: :cascade` from the table definitions in `backend/db/schema.rb`:
```ruby
# Before
create_table "categories", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci", force: :cascade do |t|

# After
create_table "categories", charset: "utf8mb4", collation: "utf8mb4_0900_ai_ci" do |t|
```

### 8. Removed init.sql Volume Mount

**Bug**: The `db/init.sql` was being mounted and executed on database initialization, creating tables that conflicted with Rails' schema.rb.

**Fix**: Removed the init.sql volume mount from `docker-compose.yml`:
```yaml
# Removed this line:
# - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
```

### 9. Entrypoint Script Argument Handling with Command

**Bug**: The entrypoint script was receiving `rails server -b 0.0.0.0` as arguments, but when it tried to exec with `exec "$@"`, it was looking for a `rails` command in PATH which didn't exist.

**Fix**: Two changes were made:

1. Updated `docker-compose.yml` to explicitly specify the command:
```yaml
command: /rails/bin/docker-entrypoint rails server -b 0.0.0.0
```

2. Updated `backend/bin/docker-entrypoint` to properly handle the `rails` argument by shifting it:
```bash
# If the first argument is 'rails', use the full path and pass remaining args
if [ "$1" = "rails" ]; then
  shift
  exec /rails/bin/rails "$@"
else
  exec "$@"
fi
```

## Files Modified

1. `backend/Dockerfile` - Added libyaml-dev, sed command for line endings, chmod for executables
2. `backend/bin/docker-entrypoint` - Fixed paths, added database wait logic
3. `backend/db/schema.rb` - Removed force: :cascade
4. `docker-compose.yml` - Fixed volume mounts, changed database credentials, removed init.sql mount

## Verification

After applying all fixes, verify the containers are running:

```bash
docker-compose ps
```

Expected output:
```
NAME                     IMAGE           STATUS
expense_system_backend   likha-backend   Up
expense_system_db        mysql:8.0       Up (healthy)
```

Check backend logs:
```bash
docker-compose logs backend
```

Expected output should show:
```
Waiting for database at db...
Database is ready!
```

## Running the Application

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Access the Rails console
docker-compose exec backend rails console
```

## Notes

- The backend is now accessible at `http://localhost:3000`
- The database is accessible at `localhost:3306`
- For development, consider using Unix line endings (LF) for all scripts to avoid CRLF issues on Linux containers