export const PUBLIC_ROUTE_KEY = 'Public';

export const ROLES_DECORATOR_KEY = 'Roles';

export const AUTH_ERROR_MESSAGES = {
    accessToken: {
        missing: '访问令牌无效或缺失',
        invalid: '访问令牌已失效，请重新登录',
    },
    refreshToken: {
        missing: '刷新令牌无效或缺失',
        invalid: '刷新令牌已失效，请重新登录',
    },
} as const;

export const THROTTLER_KEY_PREFIX = 'throttler:';

export const THROTTLER_ERROR_MESSAGE = '请求过于频繁，请稍后再试';

export const THROTTLER_INCREMENT_LUA = `
local counterKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])
local now = tonumber(ARGV[4])

local blockedUntil = redis.call('GET', blockKey)
local isBlocked = blockedUntil ~= false and tonumber(blockedUntil) > now
local timeToBlockExpire = 0

if isBlocked then
    timeToBlockExpire = math.max(1, math.ceil((tonumber(blockedUntil) - now) / 1000))
end

local totalHits = 0

if not isBlocked then
    totalHits = redis.call('INCR', counterKey)
    if totalHits == 1 then
        redis.call('PEXPIRE', counterKey, ttl)
    end

    if totalHits > limit then
        redis.call('SET', blockKey, now + blockDuration, 'PX', blockDuration)
        isBlocked = true
        timeToBlockExpire = math.max(1, math.ceil(blockDuration / 1000))
    end
end

local pttl = redis.call('PTTL', counterKey)
local timeToExpire = pttl > 0 and math.max(1, math.ceil(pttl / 1000)) or 1

return { totalHits, timeToExpire, isBlocked and 1 or 0, timeToBlockExpire }
`;
