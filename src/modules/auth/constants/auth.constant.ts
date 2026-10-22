export const PASSWORD_PATTERN =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const PASSWORD_PATTERN_MESSAGE =
    '密码至少 8 位，且需包含大小写字母、数字和特殊字符';

export const PASSWORD_DESCRIPTION =
    '密码（至少 8 位，须包含大小写字母、数字及特殊字符）';

export const PASSWORD_EXAMPLE = 'Password@123';

export const AUTH_CODE_CONSUME_LUA = `
    local raw = redis.call('GET', KEYS[1])
    if not raw then return 0 end
    local record = cjson.decode(raw)
    if record.attempts >= tonumber(ARGV[2]) then
        redis.call('DEL', KEYS[1])
        return 3
    end
    if record.hash ~= ARGV[1] then
        record.attempts = record.attempts + 1
        local ttl = redis.call('PTTL', KEYS[1])
        if ttl > 0 then
            redis.call('SET', KEYS[1], cjson.encode(record), 'PX', ttl)
        end
        return 2
    end
    redis.call('DEL', KEYS[1])
    return 1
`;

export const AUTH_CODE_QUOTA_INCR_LUA = `
    local used = tonumber(redis.call('GET', KEYS[1]) or '0')
    if used >= tonumber(ARGV[2]) then
        return -1
    end
    used = redis.call('INCR', KEYS[1])
    if used == 1 then
        redis.call('EXPIRE', KEYS[1], ARGV[1])
    end
    return used
`;

export const AUTH_TOKEN_CLEAR_USER_SESSIONS_LUA = `
    local userKey = KEYS[1]
    local members = redis.call('SMEMBERS', userKey)
    for _, tokenHash in ipairs(members) do
        redis.call('DEL', 'auth:access:' .. tokenHash)
        redis.call('DEL', 'auth:refresh:' .. tokenHash)
    end
    redis.call('DEL', userKey)
`;

export const AUTH_TOKEN_ROTATE_SESSION_LUA = `
    ${AUTH_TOKEN_CLEAR_USER_SESSIONS_LUA}
    redis.call('SET', ARGV[1], ARGV[2], 'EX', ARGV[3])
    redis.call('SET', ARGV[4], ARGV[2], 'EX', ARGV[5])
    redis.call('SADD', userKey, ARGV[6], ARGV[7])
    redis.call('EXPIRE', userKey, ARGV[5])
    redis.call('SET', KEYS[2], ARGV[8], 'EX', ARGV[5])
    return 1
`;

export const AUTH_TOKEN_REVOKE_USER_LUA = `
    ${AUTH_TOKEN_CLEAR_USER_SESSIONS_LUA}
    redis.call('DEL', KEYS[2])
    return 1
`;
