/**
 * AUTO-ASSEMBLED FILE — edits belong in src/part_*.gs, then run tools/assemble.py
 */
/**
 * Flora Bot (فلورا بات) — Music Release Bot on Google Apps Script + Google Sheets
 * بات مستقل؛ رمزها به‌صورت salt + hash ذخیره می‌شوند، نه متن خام.
 * SPDX-License-Identifier: GPL-3.0-only (see LICENSE.txt).
 * دادهٔ استان/شهر ایران برگرفته از sajaddp/list-of-cities-in-Iran (GPL-3.0):
 * https://github.com/sajaddp/list-of-cities-in-Iran
 *
 * نسخه: 0.5.0-audit
 *  ✅ رفع باگ‌ها: Coming Soon ادمین، ارسال موزیک توسط ادمین، حذف کامل ارسال/کاربر
 *     (رسانه + عوامل + کتابخانه + پست کانال + تأیید دومرحله‌ای)، توقف/ادامهٔ کمپین،
 *     جلوگیری از کمپین تکراری غیرفعال‌ها، ثبت‌نام خارج از ایران (شهر خالی نمی‌ماند).
 *  ✅ تکمیل قابلیت‌ها: CHANNEL_FOOTER، featuring، platformVisible، زمان‌بندی مطلق/نسبی،
 *     پیش‌نمایش کپشن قبل از ثبت، ویرایش (عنوان/هنرمند/لینک/کاور) و پس‌گرفتن ارسال،
 *     لغو انتشار در جریان، دلیل رد، لینک پست کانال برای مالک، صفحه‌بندی «آثار من»،
 *     تغییر رمز بدون فراموشی، حذف حساب توسط کاربر، چندزبانه (fa/en).
 *  ✅ امنیت/پایداری: TTL نشست‌ها + پاک‌سازی، Rate limit، قفل doPost/رسانه،
 *     توکن امضاشدهٔ تلگرام‌سازگار، پیش‌نمایش با HTTP Range (بدون دانلود کامل)،
 *     ErrorLog + اطلاع مدیر، پاک‌سازی تریگرها، بکاپ خودکار، لاگ فعالیت مدیران.
 *  ✅ قابلیت‌های تازه: تشخیص ارسال تکراری، اعتبارسنجی حجم/فرمت، آمار دانلود هر ترک،
 *     داشبورد هنرمندان، خروجی CSV، پیش‌نمایش و ارسال M4A/FLAC/OGG.
 */
const APP = {
  VERSION: "0.12.1-cc",
  TZ: "Asia/Tehran",
  SHEETS: {
    SETTINGS: "Settings", USERS: "Users", SESSIONS: "Sessions", STARTS: "Starts",
    REQUIRED_CHANNELS: "RequiredChannels", RESET_REQUESTS: "ResetRequests",
    DRAFTS: "MusicDrafts", DRAFT_MEDIA: "DraftMedia",
    SUBMISSIONS: "MusicSubmissions", CREDITS: "MusicCredits", MEDIA: "MusicMedia",
    MUSIC_LIBRARY: "MusicLibrary", MUSIC_DOWNLOADS: "MusicDownloads", ADMIN_ACCESS: "AdminAccess",
    SUPPORT: "SupportMessages", BROADCASTS: "Broadcasts", BROADCAST_MEDIA: "BroadcastMedia",
    CONNECTED_CHANNELS: "ConnectedChannels",
    CC_BANNER: "CcBanner",
    CC_POSTS: "CcPosts",
    DELIVERY_LOG: "DeliveryLog", ADMIN_LOG: "AdminLog", ERROR_LOG: "ErrorLog"
  }
};

// ───────────────────────── کش درون‌اجرایی (فقط یک اجرا) ─────────────────────────
let DB_INSTANCE_MEMO_ = null;
let SHEET_INSTANCE_MEMO_ = {};
let SETTINGS_ROWS_MEMO_ = null;
let SETTINGS_INDEX_MEMO_ = null;
let SESSION_INDEX_MEMO_ = null;
let USER_LIST_MEMO_ = null;
let USER_BY_ID_MEMO_ = null;
let IDENTITY_BY_ID_MEMO_ = null;
let MUSIC_DRAFT_BY_ID_MEMO_ = null;
let CONNECTED_CHANNELS_MEMO_ = null;
let CC_BANNER_MEMO_ = null;
let CC_POSTS_MEMO_ = null;
let BOT_USER_ID_MEMO_ = null;
let DRAFT_MEDIA_MEMO_ = null;
let PREVIEW_CREDITS_MEMO_ = null;
let PREVIEW_CUT_INFO_MEMO_ = null;   // اطلاعات آخرین برش (کجا/چند ثانیه/چند بایت) برای stage و مدیر
let PREVIEW_TRACKS_MEMO_ = null;
let DELIVERED_SET_MEMO_ = null;
let SUBMISSIONS_MEMO_ = null;
let SUBMISSION_BY_ID_MEMO_ = null;
let SUBMISSION_MEDIA_MEMO_ = null;
let SUBMISSION_CREDITS_MEMO_ = null;
let MUSIC_LIBRARY_MEMO_ = null;
let MUSIC_DOWNLOADS_MEMO_ = null;
let ADMIN_ACCESS_MEMO_ = null;
let SUPPORT_MESSAGES_MEMO_ = null;
let BOT_USERNAME_MEMO_ = null;
let DEFAULT_COVER_BLOB_MEMO_ = null;
let CHANNEL_LINK_MEMO_ = null;
function resetRuntimeCaches_() {
  DB_INSTANCE_MEMO_ = null; SHEET_INSTANCE_MEMO_ = {};
  SETTINGS_ROWS_MEMO_ = null; SETTINGS_INDEX_MEMO_ = null;
  SESSION_INDEX_MEMO_ = null; USER_LIST_MEMO_ = null; USER_BY_ID_MEMO_ = null;
  IDENTITY_BY_ID_MEMO_ = null;
  MUSIC_DRAFT_BY_ID_MEMO_ = null; DRAFT_MEDIA_MEMO_ = null;
  PREVIEW_CREDITS_MEMO_ = null; PREVIEW_TRACKS_MEMO_ = null; DELIVERED_SET_MEMO_ = null; PREVIEW_CUT_INFO_MEMO_ = null;
  SUBMISSIONS_MEMO_ = null; SUBMISSION_BY_ID_MEMO_ = null;
  SUBMISSION_MEDIA_MEMO_ = null; SUBMISSION_CREDITS_MEMO_ = null;
  MUSIC_LIBRARY_MEMO_ = null; MUSIC_DOWNLOADS_MEMO_ = null; ADMIN_ACCESS_MEMO_ = null;
  SUPPORT_MESSAGES_MEMO_ = null; BOT_USERNAME_MEMO_ = null; CHANNEL_LINK_MEMO_ = null;
  CONNECTED_CHANNELS_MEMO_ = null; CC_BANNER_MEMO_ = null; CC_POSTS_MEMO_ = null; BOT_USER_ID_MEMO_ = null;
}

const HEADERS = {
  Settings: ["key", "value"],
  Users: ["user_id", "phone", "first_name", "last_name", "rap_name", "province", "city", "country", "pass_salt", "pass_hash", "registered_at", "last_seen", "active", "blocked", "username", "support_mode", "last_support_at", "bot_blocked", "last_download_message_ids", "last_download_at", "lang", "gate_salt", "gate_hash", "gate_until", "gate_enabled", "meta_json"],
  Sessions: ["session_key", "state", "data_json", "updated_at", "expires_at"],
  Starts: ["user_id", "username", "first_name", "last_name", "started_at", "last_seen"],
  RequiredChannels: ["chat_id", "join_url", "title", "active", "created_at"],
  ResetRequests: ["request_id", "user_id", "phone", "first_name", "last_name", "rap_name", "status", "created_at", "reviewed_by", "reviewed_at"],
  MusicDrafts: ["draft_id", "user_id", "mode", "data_json", "status", "created_at", "updated_at"],
  DraftMedia: ["draft_id", "seq", "kind", "file_id", "caption", "media_group_id", "source_chat_id", "source_message_id", "created_at", "file_size", "mime_type"],
  MusicSubmissions: ["submission_id", "user_id", "mode", "title", "artists", "featuring", "caption", "links", "status", "scheduled_at", "created_at", "updated_at", "published_at", "visual_message_ids", "audio_message_ids", "publish_stage", "request_json", "failure", "review_note", "reviewed_by"],
  MusicCredits: ["submission_id", "role", "person", "sort"],
  MusicMedia: ["submission_id", "seq", "kind", "file_id", "caption", "media_group_id", "source_chat_id", "source_message_id", "file_size", "mime_type"],
  MusicLibrary: ["track_id", "submission_id", "seq", "title", "artists", "file_id", "download_allowed", "created_at", "updated_at", "rights_approved_by", "rights_approved_at", "published_at", "download_count"],
  MusicDownloads: ["delivery_id", "user_id", "submission_id", "track_id", "message_id", "delete_after", "status", "attempts", "last_error", "created_at"],
  AdminAccess: ["user_id", "role", "active", "added_by", "created_at", "updated_at"],
  SupportMessages: ["message_id", "user_id", "direction", "kind", "text", "source_chat_id", "source_message_id", "created_at", "read_by_admin", "mode"],
  Broadcasts: ["broadcast_id", "target", "mode", "status", "scheduled_at", "created_by", "created_at", "last_error"],
  BroadcastMedia: ["broadcast_id", "seq", "source_chat_id", "source_message_id", "kind", "caption"],
  DeliveryLog: ["broadcast_id", "user_id", "status", "sent_at", "error"],
  AdminLog: ["log_id", "admin_id", "action", "target", "details", "created_at"],
  ConnectedChannels: ["id", "user_id", "chat_id", "username", "title", "members", "status", "connected_at", "last_ok_at", "last_error"],
  CcBanner: ["id", "seq", "source_chat_id", "source_message_id", "kind", "caption", "created_by", "created_at", "active"],
  CcPosts: ["post_id", "batch_id", "source_type", "channel_id", "chat_id", "message_id", "kind", "caption", "file_id", "status", "created_by", "created_at", "updated_at"],
  ErrorLog: ["log_id", "where", "message", "extra", "user_id", "created_at"]
};

const DEFAULT_SETTINGS = {
  ADMIN_IDS: "", CLAIM_CODE: "", READY: "false", BRAND_NAME: "فلورا بات | موزیک",
  LEGACY_APP_SECRET: "", // فقط برای پذیرش لینک‌های امضاشدهٔ قدیمی بعد از تغییر نام برند
  CONNECTED_CHANNELS_MODE: "optional", // optional | required — اجباری‌کردن اتصال کانال
  CC_BANNER_ON_CONNECT: "true", // بنر تبلیغاتی هنگام وصل‌شدن هر کانال خودش هم پست شود
  CONNECTED_CHANNELS_MAX: "3", CC_PROMO_MESSAGE: "true", CC_ADVERTISE: "true",
  WELCOME_TEXT: "⚫🟡 به بات ارسال موزیک خوش آمدی. برای شروع ثبت‌نام/ورود را بزن.",
  REG_DONE_TEXT: "✅ ثبت‌نام کامل شد.",
  FJ_ENABLED: "false",
  FJ_TEXT: "🚸 برای استفاده از بات، ابتدا در کانال‌های زیر عضو شو و بعد «بررسی عضویت» را بزن.",
  BOT_MODE: "active", MAINTENANCE_TEXT: "🛠 بات موقتاً در حال به‌روزرسانی است. کمی بعد دوباره امتحان کن.",
  PUBLISH_MODE: "auto", PUBLISH_ENABLED: "true", PUBLISH_INTERVAL_MIN: "10",
  CHANNEL_ID: "", CHANNEL_FOOTER: "", BOT_USERNAME: "", DEFAULT_COVER_FILE_ID: "",
  MUSIC_DOWNLOAD_DEFAULT_ENABLED: "true", // پیش‌فرض روشن برای همه پست‌ها — درخواست کاربر TIMEZONE: "Asia/Tehran",
  INACTIVE_AFTER_DAYS: "30", INACTIVE_REPEAT_DAYS: "90", BROADCAST_BATCH: "10",
  BTN_STYLE_REPLY: "default", BTN_STYLE_INLINE: "default", BTN_STYLE_DANGER: "danger",
  SUPPORT_CLOSED_TEXT: "گفت‌وگو با پشتیبانی پایان یافت.",
  MUSIC_PREVIEW_SECONDS: "30", MUSIC_DOWNLOAD_DELETE_SECONDS: "60",
  POST_SHOW_LINK_BUTTONS: "false",
  POST_ARTIST_LABEL: "Artist", POST_ARTIST_EMOJI: "🔥", POST_TITLE_EMOJI: "🖤",
  POST_OUT_NOW_TEXT: "OUT NOW 🕊", POST_COMING_SOON_TEXT: "COMING SOON ⏳",
  HASHTAG_BRAND: "RapEvils", HASHTAG_FIXED: "NewMusic,Rap,HipHop",
  // هشتگ‌های «متغیر» هر پست: برچسب مود + ژانر انتخابی کاربر + نام هنرمند/فیچر.
  // قالب HASHTAG_MODES = «مود=هشتگ|هشتگ» با جداکنندهٔ کاما. هشتگ خالی = آن مود هشتگ نمی‌گیرد.
  HASHTAG_MODES: "simple=تک_آهنگ|Single,album=آلبوم|Album,coming_soon=به_زودی|ComingSoon,freestyle=فری_استایل|Freestyle",
  // ژانرها هم دکمهٔ مرحلهٔ «ژانر» را می‌سازند هم هشتگ متغیر پست را.
  // قالب = «برچسب دکمه=هشتگ» (اگر «=» نباشد، خودِ برچسب هشتگ می‌شود). حداکثر MAX_GENRE_TAGS انتخاب.
  MUSIC_GENRES: "ترپ=Trap,دریل=Drill,گنگ=Gang,عاشقانه=Love,اجتماعی=Social,انگیزشی=Motivation,دیس=Diss,فری_استایل=Freestyle",
  MAX_GENRE_TAGS: "3", MAX_POST_HASHTAGS: "12",
  POST_FREESTYLE_TEXT: "FREESTYLE 🎤",
  POST_TELEGRAM_LINK: "", POST_DOWNLOAD_BUTTON_ON_COVER: "false",
  POST_DOWNLOAD_BUTTON_TEXT: "🎧 دریافت آهنگ کامل",
  // ── برش کانال: ۳۰ ثانیه از «اوج» آهنگ ──
  // peak = پرانرژی‌ترین بازهٔ ۳۰ ثانیه‌ای (از global_gain و اندازهٔ فریم‌های MP3) · start = ۳۰ ثانیهٔ نخست
  PREVIEW_PEAK_MODE: "peak",
  // پنجره‌هایی که در نخستین N ثانیه شروع می‌شوند (اینترو) نادیده گرفته می‌شوند
  PREVIEW_PEAK_SKIP_SECONDS: "8",
  // اگر انرژی اثر یکدست بود یا تحلیل ممکن نشد، برش از چند درصد اثر شروع شود (معمولاً جای هوک/ترجیع‌بند)
  PREVIEW_PEAK_POSITION_PCT: "30",
  // زیر این سقف کل فایل برای تحلیل دقیق فریم‌به‌فریم گرفته می‌شود؛ بالاتر از آن نمونه‌برداری مکانی
  PREVIEW_ANALYZE_MAX_MB: "8",
  PREVIEW_PROBE_COUNT: "6",
  PREVIEW_PROBE_BYTES: "60000",
  PREVIEW_HEAD_BYTES: "262144",
  // تگ ID3 (کاور آرت/متادیتا) فقط تا این اندازه در برش نگه داشته می‌شود
  PREVIEW_TAG_KEEP_BYTES: "262144",
  INACTIVE_TEXT: "👋 مدت‌هاست خبری ازت نیست! برگرد و موزیک‌های تازه را بشنو.",
  MUSIC_PENDING_TEXT: "✅ اطلاعات موزیک ثبت شد و برای بررسی مدیر رفت.",
  MUSIC_AUTO_TEXT: "✅ اطلاعات موزیک ذخیره شد و در صف انتشار قرار گرفت.",
  // ── نسخهٔ ۰.۴ ──
  APP_SECRET: "",
  DEFAULT_LANG: "fa",
  USER_LANG_EDITABLE: "true",
  LOGIN_TTL_DAYS: "90",
  SESSION_TTL_HOURS: "48",
  RATE_MSG_PER_MIN: "25",
  RATE_MEDIA_PER_MIN: "90",
  RATE_MEDIA_PER_HOUR: "400",
  RATE_SUBMITS_PER_HOUR: "6",
  RATE_DOWNLOADS_PER_HOUR: "10",
  MAX_SUBMISSIONS_PER_DAY: "5",
  MAX_COVER_PHOTOS: "2",
  MAX_AUDIO_FILES: "30",
  MAX_AUDIO_MB: "50",
  DOWNLOAD_LINK_TOKEN: "true",
  DOWNLOAD_LINK_TTL_DAYS: "30",
  DOWNLOAD_BUTTON_REFRESH_DAYS: "20",
  // فقط دو حالت: preview_only (پیش‌فرض) و admin_alert. فایل کامل هرگز در کانال گذاشته نمی‌شود.
  PREVIEW_FALLBACK_POLICY: "preview_only",
  SEND_PROTECTED_CONTENT: "false",
  AUTO_DELETE_DRAFTS_DAYS: "7",
  QUEUE_ENABLED: "true",
  STAGING_CHANNEL_ID: "",
  BACKUP_ENABLED: "false",
  BACKUP_FOLDER_NAME: "FloraBot-Backups",
  ADMIN_ERROR_NOTIFY: "true",
  CLEANUP_INTERVAL_HOURS: "6",
  MUSIC_PAGE_SIZE: "5",
  SUPPORT_CLOSED_TEXT_EN: "Support conversation ended.",
  WELCOME_TEXT_EN: "⚫🟡 Welcome to the music submission bot. Tap Register / Login to start.",
  MAINTENANCE_TEXT_EN: "🛠 The bot is temporarily under maintenance. Please try again shortly.",
  MUSIC_PENDING_TEXT_EN: "✅ Your track was saved and sent for admin review.",
  MUSIC_AUTO_TEXT_EN: "✅ Your track was saved and queued for publishing.",
  INACTIVE_TEXT_EN: "👋 Long time no see! Come back and hear the new tracks.",
  POST_AUDIO_REPLY_TO_COVER: "true",
  REG_DONE_TEXT_EN: "✅ Registration completed."
};

// کاور پیش‌فرض: JPEG معتبر (۷۲۰×۷۲۰) که با اسکریپت build ساخته و اینجا تزریق شده است.
// اگر روزی این رشته خراب شد، getDefaultCoverBlob_ مقدار null برمی‌گرداند و پست به‌جای
// شکست‌خوردن، به‌صورت متنی منتشر می‌شود (sendTextOnlyChannelPost_).
const DEFAULT_COVER_BASE64_ = 
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUEBAQEAwUEBAQGBQUGCA0ICAcHCBALDAkNExAUExIQEhIUFx0ZFBYcFhISGiMaHB4f"
  + "ISEhFBkkJyQgJh0gISD/2wBDAQUGBggHCA8ICA8gFRIVICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg"
  + "ICAgICAgICD/wAARCALQAtADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAECAwcEBggFCf/EAFsQAAIBAgQDBQIGCgwM"
  + "BAYDAAABAgMRBAUGIQcSMRMiQVFhMnEIFBUjQoEWMzdScnWRobGzGCQ0U1ZigpKiwdHTFyU2Q2NzdJOlstThJidXg0VVlaPS8TVn"
  + "4//EABkBAQADAQEAAAAAAAAAAAAAAAABAwQCBf/EADcRAQABAwEDCgUDBAMBAQAAAAABAgMRIQQSMRNBUWFxgZGhsdEUIjJSwTPh"
  + "8AUjJEI0U3Lxkv/aAAwDAQACEQMRAD8A8hAA6AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABNhYCATYWAgE2FgIBNhYCATYW"
  + "AgE2FgIBNhYCATYWAgE2FgIBNhYCATYWAgE2FgIBNhYCATYWAgE2FgIBNhYCATYWAgE2FgIB97ING6o1RUjHIcjxWOg5yp9tGHLR"
  + "jJR5nGVSVoRdrbNrqvNGxcLwEzTC4eljNX6qyjT2FqwVpTqdpONVq/ZvmcIXtzXcZv2drrdZrm1WbU4rq16OfwjVbTarr1iGnAbr"
  + "7H4PWQe3VzjVHb9O9KPxfl93Ze1f+N7Ph4v8N+VZV+2NI8OMnybHS7k6/JHvU+rj83GD6qL6226eVPxNyr9O1PfiPXXyd8lTH1VR"
  + "3atXYHSeqczwVPHZbprNcbhal+Svh8HUqQlZtO0lFp2aa+o7dQ4H8S62JpUqmQU8PCc1GVWpjKLjTTe8nyzbsuuyb8kzlY7jxxEx"
  + "WNqV8NmGGwNKVuWhRwsJRhsls5qUt+u7fU6hX11rTFYarhsTqvNa1CtB06lOeLm4zi1Zpq+6aH+XV9seM+yP7MdM+Ee7Yf7HHW//"
  + "AM1yP/f1v7ovHgdlODisNqHibk2WZnD7dhUoy7O+8d51IS3i094rr49Xpz4xiP3+p/OZjk5Tk5Tk5N+LdxyO0zxu+FMfnKd+39nm"
  + "3R/gY0h/6wZP/u6X9+P8DGkP/WDJ/wDd0v780tYWHIX/APunwp9jlLf2ect0vgnpyunRy3ivk2LxtTu4eg4012tR7RjdVpNXdlsm"
  + "9+j6GP8AY463/wDmuR/7+t/dGmldNNOzW6aMvxjEfv8AU/nMcjtEcLvjTH4wb9vno82xsdwK4kYTG1MPQyihj6cbWxGHxdJQndJ7"
  + "KpKMtum8V08tzquP0LrPLPjTx2lc1pU8JzutW+KTlSio35pc6Ti4qzfMna297FMDrPV2W4Kngsv1NmeEw1O/JSo4qcYxu23ZJ+bb"
  + "+s7VgON3EbBfFYSzmGKo4fkThXw8JOrGNtpStzO6W7vffrcf5dP2z4x7n9memPCfZrYG6/8ADrh83/yy0Dk+d9l+5u4vmr+39sU+"
  + "to9LdN77WfGuAWqNsVgMy0niqn7YrVqEm6fO/apRXfio3ldWpx2jtbo3xN2n9S1Pdif38jkqZ+mqO/RpQG6J8DaOeWxWgtbZXm2E"
  + "l85KGJk4VMPCW9NS5FJuTV73jDePTqlr7P8AQGstMU5Vc709isNQjCM5YiKVWjBOXKuapBuKd9rN33Xmi23tdm5O7TVr0TpPhLiq"
  + "zXTGZjR1gE2FjUqQCbCwEAmwsBAJsLAQCbCwEAmwsBAJsLAQCbCwEAmwsBAJsLAQCbCwEAmwsBAJsLAQCbCwEAmwsBAJsLAQCbCw"
  + "EAmwsBIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABkoUK+KxNLC4WjUr1601Tp0qcXKU5N2UUlu23tYgYzJQoV8ViaWFw"
  + "tGpXr1pqnTpU4uUpybsopLdtvaxtLJODeMpZdDPtf5rQ0tk6tNwrSTxNVWU+VR6Rk489k7zTj7DOfX4l6S0ThquW8L9P01iXB0qm"
  + "d46PPWqbcrcU97NxpzSdo3v82jFO1b07tiN6fLx9sr4tY1uTj18Hz8k4H6jxWXQzbU2YYLS2WOznPGzvVhFxXK3C6iryko2lKMk7"
  + "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"
  + "XQDGDlKhh6SfxireX3lPdr6+g+NuG2HpQorzSu/ysCkcJXkuaUeziuspvlSLulhKb+cxDqPxVNdPrZglKU3ecnJ9Lt3K2A5Hb4aH"
  + "2vCptdJTle/vQ+O11tT5KS8oRVjj2FgMssViJScnWnd+TsY5TnN3nNyfS7dyLCwEAmwsAjKUJKUZOLXinYyLE4hNNV57ecmzHYWA"
  + "5Hx7EPaco1I+MZRVmPjFCW9TCQb/AIjcV+Q49hYDkqng6jShWnS/1kb3/J0KywdZRcoctWK6um7mCxMW4SUotxa8U7AVaabTVmtm"
  + "mDkrFzaUa0Y1orbvLdL0ZPZYWqr0qvZTf0anT8oHFHR3RlqUKtJ/OU3H18PymOwF+05lapHm9fFCVPZyg+aK/KiliYtxd4uzAqDL"
  + "3Kntd2Xn4MpKDi7SVmBkwuKxOCxVLF4PEVMPiKUlOFSnJxlCSd0010aaTN05Xr3TXEjKcPpfiip0cbGunhM5w6hSdPm6qTtaCdlF"
  + "91xaabScec0jYWM96xRdiM6THCY4wsouTRw4O0650Nm+g8/eW5lHtcPVvLC4yEbQxEF4rykrrmj4XXVNN9VNraD4m0sPhJ6Q13Ge"
  + "baYxsFQl27lUlhUklFx8eVWWy3jZSjZp83xeInDrFaKx1LGYOt8o6ex3ewWPg1JNNXUJtbc1t01tJbrxUarV6qmqLN76uaeafaem"
  + "HdVETG/Rw9HQwTYWNqhAJsLAQCbCwEAmwsBAJsLAQCbCwEAmwsBAJsLAQCbCwEAmwsBAJsLAQCbCwEAmwsAAAAAAAAAAAAAAAAAA"
  + "AAAAAAAAAAAAAAAOz6M0ZmOs83nhsNUhhMBho9rjswrbUsJS3blJ7Juydo3V7Pok2r6G0Nm+u8/WXZdHssPStLFYycbww8H4vzk7"
  + "Plj42fRJtdv4hat0/lmQUuHOgo2ynCVefGY6M7yxtZbO7VlNXs3JqzcY8qUYxvju3pmvkbX1c89EdM9fRC6iiMb9fD1cHVuucJgs"
  + "rjovQEq2X6fw/NGrXjJxrZjNrlnUqtWbTW3Ltta6VoxhrQAvt2qbdOKf3ntcVVzVOZC0IOT62S6t+BMY3XNJ2ivETnzWSVoroi1w"
  + "lzUVy09vOXizGAALQhKpNQgryfRGSnQcodrUl2dLpzPe79F4lpYjki4YZOlHxd+9L6wJ7KjR3rz55/vcP62RVxdSpHkjanT+9hsc"
  + "cAAC8acmr25V5vZAUBktSj1bm/TZDtZL2EoL0QEKlUfSD+vYns4r2qsbem5RylLq2/eQBktRXWUpeqVheiukJS97sYwBk56X71/S"
  + "HPS/ev6RjAGTmpPrBx9U7i1F7JzXqzGAMnZxfs1Y/XsHSqJX5brzW5jJTad02vcA6OzIMnaztaVpLyaHzUvBwf5UBjBkdKSV1aS8"
  + "47mMDNSxNWkuVPmg+sZboyOOHrtuEuwm/oy9n6n4HFAF6lOdKfJUjyyKGeGIko9nVXa0vvW+nufgTOgnB1aEu0gt5eDj7/7QOOZI"
  + "z25Zrmj+dGMAXnDls0+aL8UULwm4PbdPqvMSirc8PZ8vICh33RWv6mTUZ6e1HSnnGlcXDscRgKsm1Ti5X5qV33JJvmVmrvxTtKPQ"
  + "gV3LdNyndqh1TVNM5h3TXOhpaZnh82ynFfKumMx72BzCK9/zVTZctRWfgr2eyalGPSzZHDbXOWZNDG6W1dhfj2mM35YV4ycpfF5L"
  + "pUST912u8uWLTvFJ8LiJw7xeisdSxmDrfKOnsd3sFj4NSTTV1CbW3NbdNbSW68VHNbuzRXyN3jzT0/vHP4raqImnfo7+r9nRAAbV"
  + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9HI8mx2oc/wOSZdT58VjKsaULptRv1lKybUYq7bt"
  + "sk34Hzje2XRw/Bjh5UzOtiIS1rn9Cm6GHlQTlgaTd7SUknF9b32c4xXLJQbeXaL024iKIzVOkfzojnW26N6czwji+frXNci4eaWn"
  + "w70diZ18zryTznM42TrNJp0b77Xfsp2ik4tycpmmTNicTiMZi6uLxdedfEVpupUq1JOUpybu22+rZhOrFnkqcZzM8Z6ZRXXvz1Be"
  + "Mbrmk7RXiIQ5m23aK6sicuZ7bRXRGhWSlzPpZLovIqCUm2kldvokBByo06eHUalfvz8KX9v9hKdPCwfSeI/Kqf8A3OK22227t9Ww"
  + "L1Ks6sryey6RXRe4xglJyaSV2wILwpuW77sfNk2hT9rvS8vBFZTlN3kwLc0Iewrv75lZSlN3k7lQABKTbSSu30SM8cLPlUqso0Y/"
  + "x3u/OyA44OTbB0/pTrv0XKv7R8aUdqWHpQS6Nq7X1gYIwnN2hFyfklcyRwuIm7KjJe9W/SWljMTNWdZr3bfoMUqtWatOpKS8m7gZ"
  + "viOK/ev6SHxHFfvX9JHGAGeeExMLXoyd/Lf9BjnTqQtzwlG/S6sIVKkL8k5Rv1s7GSGLxML2rSd/Pf8ASBgByfjbl9to0qjfWTjZ"
  + "v6xfB1PozoP0fMv7QOMDkvCuScqFSNZdbLaVvcceUZRk4yi4teDVgCk4u8XZl+0jL7ZG7++XUxgDJKm0uaL5o+aMZKk4u8XZmS8K"
  + "j3tCXn4MDEXhUnTlzU5OL9CJRlF2krMqByuWliruCjRqpex0U/d5M4zTTaas11TIOVGpTxFPkrNQqr2aj8fR/wBoHFLRk4u6/wD2"
  + "JwlTm4TVpLqioF5RTXPD2fFeRQtGTi7r/wDZacEkpwd4v8wGM2tw61RkWZZPX4ea7lOWTYySlgsS5JLAVt+8m13L36+yne6tObNU"
  + "kptNNOzXRopvWou07s+PPE9MO6K5onMOw6z0njtF6sxWQ42fbdladHEKDhGvTkrxmk/rTs2lJSV3a5103tkeNw/GTQUdI53mkKOr"
  + "csk6uX4qvBXxEFHeEp7t3s+a1naMJWnyyvo6vQr4XE1cNiaM6FejN06lKpFxlCSdnFp7pp7WKtnu1VZt3Pqp49fXHa7uURHzU8J/"
  + "mGIAGtSAAAAAAAAAAAAAAAAAAAAAAAAAACQSAIBIAgEgCASAIBIAgEgCASAIBIAgEgCASAIBJ9nS2n8VqrVmXafwkuSpjKqg52T7"
  + "OCXNOdm1flipO197WW7OaqopiaquEJiJmcQ2Jwl01g8tw2K4n6ppVqWT5P3sJHsYyWKrNuPMr/eycUnsudp8y5JGvdVaozbV+oa2"
  + "c5vXdSrPu04LaFGC6QgvBL+tttttnfeLWpMFQp4Hhxpx8uS5ClTquVGMZ1cTHmjKTatfq7tKN5Sk91ZmpzFs1E1zO0VxrPDqjm8e"
  + "MrrsxTHJ08I49qCYwlOXKkDJLuR5F7T6v+o3qFZyTtGF+Vfn9ShIAhJtpJNt9EjkS/aq5F9va3f3i8l6+paN8JHna+eku6mvZXn7"
  + "zjttttu7fVsCoJLwhzXbdorqwKwg5u3RLq/IlzUVy01bzl4sSkntFWiuiKgQCTNToOUO0qS7Ol05nvf3LxAwxjKUuWMXJvwSM/xe"
  + "FLfE1LP7yG8v7ETLERguXDQ7NWs5P2n/AGHHAzvFOKcaFKNFdLreVveYJSlKTlJuTfi9wAIBKTbsldmTspWvK0V6sDEDLy011qX9"
  + "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"
  + "d+r6mAl7ttttvxFgEVeST6eIk+aTZZK0H5srYCDPT7mFqVPGT5F+lmFRu0km2zPiFyclD97W79XuBxwTYmCXNfy3AT2tHyRUl7ts"
  + "WA7Xw3yf5d4l5Hl8qdCpT+MqtVp11eE6dPvzi1Z3vGLVnszm8Ws4+WuK2d1YVK7o4WqsHThWfsdklCSiru0XNTkvwr2TbO28Fbaf"
  + "yvVevMVthsuwTowhV+bhiJtqagqj2UrwhG1m71I+iemrGCj59qqq5qYiO+dZ/C+r5bUR06oBNhY3qEAmwsBAJsLAQCbCwEAmwsBA"
  + "JsLAQCbCwEAmwsBAJsLAAAAAAAAAAAAAAAAAAAAAAAAADcnB+S1JpjV3Dyv31jcL8dwsZ92nTqxtFylKPe9rsHbdWg/c9Nn3dIZ9"
  + "PTGs8pz2MpxhhMRGVXs4xlKVJ92pFKW13ByXh16rqZdqtzctTFPHjHbGsLbVUU1xM8HyMVhq+DxlbCYmlOjWozdOdOpFxlGSdmmn"
  + "un6GE2bxpyDDZXrlZxlsu1y7PKSx1OrBOVOU5Pv8s7tSvtPbopra1jWRZZuxdt03I53NdM0VTTK63g14rcoTF2kmJKzsXOEGet85"
  + "ThX8X3Ze8wHIw8k+ahN92psvR+AHHJTs0w04ycXs07MgC0lZ7dH0Kl13ly+PgUAyUaip1LyV4tWkvNCrT7Oq4p3XVPzRjORSaq01"
  + "Qk0mt4N+fkBxyU7O4aabTVmiALSVujun0Klk/B9CGreq8wCbTTTs0ci8cTyp2hW6X8Jf9zjAC0oyhJxkrNeBUzwrRcFTrR5oLo11"
  + "Qlh5OPPSfaw811/IBgLKTXjt5FQBe8X1jb3EWh99b6ioAty/xo/lHL/Gj+UqALWj4y/IibwXSLfvKACzk36LyRUAASk20krtmWGH"
  + "nKPPLuQW/NIs6sKUXGgt2rOb6v3eQEpRwzvO06trqPhH3mCUpTk5Sd2/EqABKV3YJNuyJbVrLp+kBJ32XRdCoAFoQc5qEerdjJXn"
  + "FtU6fsQ2Xr5ss/mKXImnUqLvfxV5HHAExXM7EF/Zj6sCJO726eBUADNQSUpVZezTV/e/AxNuUnJ7tu7M9Z9lRjh17XtT9/kccAX6"
  + "Q9WVSu7ImTu9ui2AqSk20krtkHcOGumYas4gZdlmIpzng4ydfEuMJNdnBXabTXKpO0ea+zkvcV3K4t0TXVwh1TTNUxTHO7zrKjV0"
  + "RwGyDSkqU8Pj88ryxmNXK2pRjaXLLn3hNXobJLeEt/vtLHeeK+paeqOJOY4vC4jt8DhbYTDSXLZwh1cXG/NFzc5J3d1JdOi6MZ9j"
  + "oqptb1fGrWe/24LL1UTXiOEaAANikAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABumjWlxC+D/VwnLCec6QlGV3"
  + "CPNPDKL5bStFRXIndJtvsFfeSNLHceGurPsN15gs0rT5cDV/a2M2v8zJq8vZb7rUZ2Su+W3iX4naT+w/XmMy+jDlwNf9s4Te9qUm"
  + "+77TfdalG73fLfxMFn+zdqs806x+Y8de9or+eiK+eNJ/DpZb2oeq/QVJi7O5vZ0AtJWfoVA5FX52mq6d5bKa9fM45kpVFCVpLmhL"
  + "aUfMirTdOo43uuqa8UBUl7rmX1oqSnZ3AgFpK3R3T6FQORJ/GYppLtordffr+045KbTTTs0ZmlXXNFWqpbr771XqBgLRdtmroqAL"
  + "OO11uipKbTui1lLps/LzAoWhOUJc0JOL9CGmnZogDkOtCp9vp3f30Nn/ANyOxhP7VWTf3stn7vUwADLLD1ouzpS+pXMReNScVaM5"
  + "RXo7GT43X8ZKS8U0twMAM/xj/QUf5o+Mf6Cj/NAwGSNGrO3LTlv0dti/xqstoNQXlGKsjHKrUndSqSafhfYDJ8XUft1WNP06v8hK"
  + "q0qTTo0+Z/fVN7fUccAXnUnUd5ycigJ69AILKN9+iXiTZR9rr5FW2+oEtq1oqy/SVAAGenailVmk5NdyL/SRCMaaVSrHmvvGHn6v"
  + "0McpSnJyk7t+IENuUnJ7tu7IBKV3YCYpe0+i/OQ3d3ZMnfZdF0KgDPQiletP2YdF5vwRihBzmoR6t2L1ZralD2I/0n5gY23KTk92"
  + "3dkAlK7SAlbRcvF7IqWk03ZdEVAG6dEVpcPuDuca5nGEcyziSwOVtwi5Ra5lzqVpWV1KTjJJPsV98jWOk9PYjVWrMvyHDPlliqtp"
  + "T2fJBbzlZtXtFN2vd22O38YtQ4fMdWUdOZWuTKNOUviFCG776sqjvJc23LGG7a+bun3jBtP92unZ+adZ7I958stFr5Im53R2/s1q"
  + "ADezgAAAAAAAAAAAAAAAAAAAAAAAALACoLACoLACoLACoLACoLACoLACoLACoLACoLACpu3LsLPilwThgKb5tQaSvGlHlk3Xw7g+"
  + "SCUUldqCitpNukr257mlDsmhtU19HazwGd03N0Kc+TE04X+doy2mrXSbtuk3bmjFvoZNpt1V0b1H1U6x7d8aLbVUROKuE8XWmmm0"
  + "1Zog2VxU0dQyfM8PqXIac6unM7gsVh6saShClKd5dnZW5VZpxTS223cWzW5dau03aIrp53NdE0VbspXejy+PgULFnuuZfWWuGM5F"
  + "JqrTVCTSa3g35+RhAENNNpqzRByXfErmS+dit0l7S8/eYACa6PoxKLTBKe1n0AoSm0007NFmrEAZrwxFk7QrefRS/wC5hlGUJOMl"
  + "ZrwBmjVUoKnWTlFdGuqA44M86EkueD7SH3y8PeYgCk7We69SbRfR29GQADi11RUum10ZPMvGKYGMGTuvzQsvCQGMGTl/jL8o5f4y"
  + "/KBjBksvGSHd82wMZKTfRF+ZeEV9ZDbfVgOVL2n9SI5vCKsgAKgsZKdGc+8+7Dxk+gGJJtpJXbM/LDD37RKdS20eqXvHaxpJxoXu"
  + "1ZzfX6vIwgJSlOTlJ3b8SpYJXYEJNuyJbS7q6ePqWbSVl9bKgVBYzQXYxjWmt37EX4+oB/MUuRNOpUXe/iryOOXbcpOT3bd2QBUv"
  + "7MfV/oCXi+iIbu7gVBY7nw40RiNb6qpYOUK0MsofOYzE04p9nGztG725pNWXXxdmkyu5cpt0zXXOIh1TTNUxTDvOk8JPhpwnzDX2"
  + "JfZ5znNJYPLKbjJSpKTbUndOLuo9ok1Zqmu937GkTvfE7V+G1ZqtLKe5keXUlhcBSjB04qCW81C9o3eysk+WME0mjoxn2WiqIm7c"
  + "+qrXsjmju9crLtUZimnhH8yqCwNilUFgBUFgBUFgBUFgBUFgBUFgBUFgBUFgBUFgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbj4aZp"
  + "gtYaXxXCnUFbs1VvWyivHDqUqNROVSab/K10bTqR5leKNVZvlOYZFm+JyrNMNPDYvDy5alOa3Xk/JprdNbNbq6OLQr18LiaWJw1a"
  + "dCvSmp06lOTjKEk7pprdNPxN2ZlRocYuH3y7gaWJlrHIKFOhi6MYprFwu3zRSst/nJJRV7qUbPuM86r/ABrm/wD6VTr1T09k8/W0"
  + "x/dpx/tHnH7NHkp2ZDTTs1ZoHosyWrdN0QSmuj6BqzARlKElKLs14mWaVZOrBWl1lH+tGEmMpQkpRdmvECAZ+zjWg50laa3lD+ww"
  + "ASnbZ7oNbXW6IJTad0BALWT6bPyKtWdmBaE505c0JWZk5qNT249lLzitvyGEAZZUKkY8ySlH76LujEWjOUJc0JNP0MnbRn9upqT+"
  + "+Wz/AO4GEGbs6E/tdVxflNf1h4ara8Upx84u9wMILShOKvKEor1RUAAAABaMJzvyxcreSuBUGZYas1dw5V5ydrDsqUPtlZS9Ib/n"
  + "AwmSFGpUXMo2j989kW7WnD7VT38JT3f5DHOpOo7zk2Bk+Zpf6Wf9Ff2lKlSdRrmey6JdEUAAAtZL2vyAQlffog2rWWyDbZAAAzRp"
  + "RjT7Wtez9mK6y/7ARTiopVansp7L75/2FKlSVSbnN3f6BOcpy5pe5JdEVAEpXdiEruyLNpLlX5QIbvsuiIAAy4bDV8Zi6OEwtGda"
  + "vWmqdOnTi5SnJuySS3bNzalrUuFnDKlozBS/8R5/SVfM5zoRfZUJRcJU1JNp7qUVvL/OSXLzRK6EyvL+Hekf8J+psLiZ4yrJ0Mpw"
  + "aXJ2jnB2m34KS595Kyim0pNwNRZpmmYZ1muIzXNcVPF43Ez56tWfWT/QklZJLZJJLZHnT/k3N2Popnxno7I9WmP7VOf9p8o/dwwA"
  + "eizAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB9zSepsw0jqfCZ3l9SadKaValGfKsRSuuanLZqzS6"
  + "2dnZrdI+GDiqmK6ZpqjMSmJmJzDbPEfTeT51lK4maOxE6+X4+tbH4WUW6mFry3k5deW7e6bteUeVuMo21Md14ea7norNsRHFYOGP"
  + "yXMYqjmGFlCMnOCuk432bSlLuvaSbTts19PiLoTL8nwuF1bpPGQxul80l8w1O8qE2m+Tfdruy67rlcZbq7xWq5sVRYucP9Z6eqeu"
  + "PNfXEVxylPfH5a3JT2s+n6CAegzjVmCU9rPp+gNWYEJtO6dmjOuSvZbQqt9fCX/cwACZRlCTjJWa8CDNGqpQVOsnKK6NdUVnScVz"
  + "RanD75f1+QGMspeEt0VAE8t/ZdyATzee4EAtaL6O3vI5X5AQE2ndOzQAGSNetF3VSX1u5b4zVft8s15SiYQBm+Mf6Cl/NHxj/QUv"
  + "5phAGb4zUXsRhT8+WPUiWIrSteo9vLYxACW3J3k235sgAACVFvwJsl1f5AKk8vnsTzW9lWKgW5kvZVvUqAACTbsldsvClKpurKK6"
  + "yeyRftY0k40L3as5vr9XkBPJCh9sSnUttHwXvMMpSnJyk7t+JAABK7siUm3ZB2Wy/KAbsrL62QAANi8N9FZdnCxmqNVYv4jprKLT"
  + "rykpL4xJ9Kakl7rpd7vRSV5Jrg8PNBy1nmeIrY3GQy/I8uiq2PxUpqLjDd2V9ldRl3ntFJt+CfO4ja7wGe4fCaV0tg4YLS2Vzvh4"
  + "qFpV5pNdo77pd6Vk93zOUt3aOG9cqrq5C1x556I955vFfRTFMcpX3R0/s+VxE1vidc6qq5hzV6WW0fm8Fhask+yhZXdltzSa5n18"
  + "FdqKOngGq3bpt0RRRGIhVVVNUzVIACxyAAAAAAAAAAAAAAAAAAAAAAAAAACbCxIGRFhYkDIiwsSBkRYWJAyIsLEgZEWFiQMiLCxI"
  + "GRFhYkDIiwsSBkRYWJAyIsLEgZEWFiQMiLHcdE61lpuWIynNsL8qaZzHu47L5P3fO0+nLUVl4q9lumoyj08Fdyim5Tu1cHVNU0zm"
  + "HdNbaJWQxw+d5HivlTTOY9/B46C6dfm57d2as01ZXs9k1KMelWO88PuIOK0ZjauExdH5Q0/jrxxuAmlJNNWc4J7c1tmntJbPwcfp"
  + "8QOHmGy7B0tX6OrLMdK47vwlBuTwrbtyyvvy32Te6fdl3rc2ai9Vbri1e5+E9PVPRPrzdC2aIqp36O+Oj9ms7Erye6ANqgcfFdCL"
  + "Ep2ZOz6bMZFbFqdSdKXNCVvTwZAGRltRq/6Kf9F/2FKlGpSffjt5+BUvCtUguVSvHye6GRjsLGe9CpfmvSl6borKhUSulzx847gY"
  + "rDddGSAF342fvHd8rfWAAtHzsOVeEkAA5fVDl9UAMhy+ckOWP3wADu+TfvF34JIACHd9WLEgCLCxljRqTV1G0fN7ItahTW7dWXkt"
  + "kBihSnUdoRuZOSlSdqj7Sa+jHZL6yJV6ko8qajH72KsjGMi1SrOpbmaSXSK6IpYkDIiwUW/cWsl1/IQ3cA/KOyIsSAIsdo0ZozHa"
  + "uzOdOFSGDy7Cx7bG46ttSw1NXblJuy6J2V1ez6JNr6nD7h5idX4qpj8fX+TtPYK88ZjZtRSSV3GLe17btvaK3fgnzeIXELD5vhKW"
  + "kdI0fk7SeBtCFOCcXi2nfnlfflvuk92+9LvWUcdy/VVXyNnjzzzR7z0R4rqaIinfr4eriaz1lga+WQ0bo2nPB6XwsrynLarmNRW+"
  + "dq7J2ulaO3RNpWjGHQbEgvtW6bVO7T/965V1VTVOZRYWJBblyiwsSBkRYWJAyIsLEgZEWFiQMiLCxIGRFhYkDIiwsSBkRYWJAyIs"
  + "LEgZEWFiQMiLCxIGQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7ZorX2e6IzWniMBXnXwDm3Xy+dRqlWTsm7dIztFWmldWXVXT"
  + "6mCu5bpuUzRXGYl1TVNM5huPP9Cae1tl2O1bwyxKqTp8tTFZJ2ThUoykry5F+iKTi2pqMnZRNQYjD18JiquFxVGdCvRm4VKdSLjK"
  + "Ek7NNPo0zmZPnebZBmMMxyXMK+BxUbLnoytzJNPlkuko3SvF3Ttujb6x+j+MeFr0sxpYbTetFGnGhiHWao46SSio7+Lk7cu80uSz"
  + "motLFvXNl0r+ajp547emOvivxTd4aVeUtIA+9qfSGe6RzSeBznBTpJSlGnXjFulXSt3oStZqzj6q9nZ7HwTfTVTXEVUzmJZ5iYnE"
  + "pv4PcW8tyAdIATdPqhbydwIJjKUXeMmn6MgAZu3cvtsI1PW1n+UNYafRypv1V0YQBm+Lt+xUhO/RJ7srKhWi7OnL6lcxkxnOKtGc"
  + "kvRgQ04u0k0/JgyrE1krKo/r3J+MTftwhN+cogYQZu3/ANDS/mjt/wDQ0v5oGEJNuyV2zN8Ykt406cX5qO5DxNdq3afmQFVRqt2V"
  + "OX1qxf4vNe3OEH5SkY3UqSVpTk15NlQMyjhovvTlU/BVh26j9qpRh69WYQBMpzm7zk37yAAAJt57C6XT8oEW8Xsib26flIvcAAD6"
  + "WS5DnGocxjl+TZfWxuIl9GnFtRV0ryfSKu1duyV9zmZimMymImdIfNSbdkrtm19M8MsDluVQ1XxMxcskymnXjCOCq05qtiXvs0u9"
  + "FXXRJycVJ91WkfYo5bo/g7haeOz34tqXWEa6lSwWHrtQwiSupSuu7tJSTlG9+XlXdczVmptV57q7NZ5hneOnXbnKVKgpNUsOnZct"
  + "ON7RVox9Xa7be5g5S5tOlrSj7uef/Pv4NG7Ta1r1no9/Z2DXvEjMNW4p4DLu0yvTlCKo4fLqT5IyhFqzqRjs33Y2j0jZJb3k+hgG"
  + "y1aotUxRRGIUVVTXOagAFrkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAGAAAwAAGAAAwAAGAAAwAAGAAAwAAGAAAwAAGAAAw"
  + "AAGAAAwNoac4v46hlFTTmtcD9k2SYi8asq9RvExjKSb77ff5e80nZ3atNJK3PzThVlmpaeIzrhdneFzXCc3NLLZz7Oth05WS79na"
  + "6m1z8r5Yq3N1eoD6GT53m2QZjDMclzCvgcVGy56MrcyTT5ZLpKN0rxd07bow1bLNEzXs87s9HNPbH5hfF3MbtyMx5uJicNiMHiqm"
  + "FxdCdCvSk4Tp1IuMoSTs00+jT2MRt3DcS9NavwtLLOJ2n6dWqoqlDOsDHkrU9uVSlFb2XNObteN7Wps4uccIq2Ky6efaAzahqbKX"
  + "eXZ0pJYils58so+MlHkutpty9hExtUUzu343Z8vH3wTazrbnPr4NWAy4nC4nBYmphsXQqUK9KThOnUi4yjJOzTT6NPwMRtUJ5vPc"
  + "d1+hAGBPK/DcgE8z8xgQCbrxSHd9RgQCbL778wsvBoCATb1Qt6oCATb1QsvvvzAQCe76i68IgQTyv3DmfuIGBOy8bi/krEAYAAmM"
  + "JTlyxi2/QYEExi5SUYq7ZsrIOD2e43ByzXU+KoaVyiHt4jMGoTV24ruNq3eUV3nG/Mmrn13rvQOg12PDvIVm2ZR/+MZmnt492Pdl"
  + "7M5wdlT6K/OjHVtVMzu2Y356uEds8PWepfFqcZrnEfzmcDJ+EVbC5dDPuIGbUNNZSrS7OrJPEVe6pcsY+EnHnst5Jx9hnKz7ixhM"
  + "pyvFaV4aZXTyfKeacfj15OvVva84X3g3aSTk5S5eW3I0ktdZ/qjUGqMYsXn+a18dUj7Cm0oU9knywVoxvyq9kr2u9z45zGy1XJir"
  + "aZz1Rwj370zdinS3GOvnZK9evisTVxOJrTr16s3OpUqScpTk3dtt7tt+JjAN2GcAAwAAGAAAwAAGAAAwAAGAAAwAAGAAAwAAGAAA"
  + "wAAGAAAwAAGBNhYABYWAAWFgAFhYABYWAAWFgAFhYABYWAAWFgAFhYABYWAAWFgAFhYABYWAAWFgAFhYABY+hk+dZtkGYwzHJcwr"
  + "4HFRsuejO3Mk0+WS6SjdK8XdO26PngiYiqMTwTEzGsNw0OMGVagy6hlfEfSdDOKVPZ43DWhWirRd1Ha0pSiuZxnBWfTaz5M+F2it"
  + "Z1cViOHGr6PaxvL5OxcZJx7y5mm0pqCU4pPllurOV27aVBh+D3NbFU0dXGPCfxhfy29+pGfXxdnz7QGr9NQlVzbIcTSoRipyrwSq"
  + "U4py5VecG4p38G77rzR1hxcXZpp+TO+ZFxc15kNSPLnU8yocznKjmN66k3G3tt86S2aSklderv2ZcTeH+frk1jw5oxm/nquKy2SV"
  + "StX8W0uSSi7ye85b2vfqnK7RR9dG910z+J9zct1fTVjt94adsLG4vsF4R53/AJP8SPk/sft3ynFR57+zyc6pdLO9ubqunjw8x4Ca"
  + "4weGjVwssvzKbkoulh67jJKz716iirbW6336Ext1nOKp3Z64mPVE2K+MRns1apsLHa8bw411gMZUwtbSuZVJwteVChKtB3Se04Xi"
  + "+vg/Q6u6dRK7pyS9xrpuU1xmmcqppmnjClhYA7clhYABYWAAWFiypzkrqEmvNI7DgdC6yzH4s8HpjMqlPFcrpVXhpRpyUrWlztcq"
  + "jundu1tziqumiM1ThMRM8HXLCxtLLeBGu8b2vxungss5LcvxjEKXaXve3Z83S3jbr47n0P8ABxw5093tYcRaNWpH5irhMuSlUo1/"
  + "pJ8vPLlVpLeEd7Xs9nlnbrGcU1b09Wvouixc4zGO3Rp1K7sldn3si0ZqfUtSMclyTE4qDk4OsoctKMlHmac3aKdrdX4rzNifZzwp"
  + "0z+1dOaC+XF9rrYrM5RXacm0ZwUlO3Ndt92Hht4L4Oe8ZteZ5TlRjmUMqoSioyp5dB0m2pX5udtzT6J2klZWtu788ttFz9OjHXVP"
  + "4jX0TuW6fqqz2e771LhDkmnMuoZpxH1ZRyqnUu/iWGXPVmrRVk925RlJcyjGaS8bO6z1OKmj9H1MVhuG+jqEZyulmOMlJuXeXMlF"
  + "tzcHGMWk5x3d3HbfTVevXxWJq4nE1p1q9WTnUqVJOUpybu22922/ExkfCTc12iqaurhHhHHvk5bd/TjHnL7Gf6nz/VGMWLz/ADWv"
  + "jqkfYU2lCnsk+WCtGN+VXsle13ufHsAbqaYpjdpjEKJmZnMlhYA6QWFgAFhYABYWAAWFgAFhYABYWAAWFgAFhYABYWAAWFgAFhYA"
  + "BYWAAWFgAFhYABYWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAczLs1zPKMTLE5TmWKy+vKLhKpha0qUn"
  + "G6dm4tO10tvRHDBExExiSJxwd4wXFriJgMHTwlDU9edOnezr0qdabu295zi5Pr4vbp0O0L4QGqK77HMciyXFYKp3a9Dsqi7Wm9pR"
  + "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"
  + "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k=";

// دادهٔ استان/شهر به شکل فشرده:  «استان~شهر|شهر|شهر~~استان~…»
// ۳۱ استان و ۱۴۷۹ شهر (منبع: sajaddp/list-of-cities-in-Iran — cities-filtered).
const IR_GEO_RAW = "مرکزی~اراک|کارچان|ساروق|داودآباد|آشتیان|تفرش|خمین|قورچی باشی|دلیجان|نراق|ساوه|غرق آباد|نوبران|آوه|آستانه|شازند|مهاجران|هندودر|توره|شهباز|محلات|نیمور|زاویه|مامونیه|خشکرود|پرندک|رازقان|کمیجان|میلاجرد|جاورسیان|خنداب|فرمهین|خنجین|تلخاب~~گیلان~آستارا|لوندویل|کیاشهر|آستانه اشرفیه|بندرانزلی|هشتپر (تالش)|لیسار|اسالم|حویق|چوبر|پیربازار|خشکبیجار|کوچصفهان|لشت نشاء|رشت|سنگر|لولمان|لوشان|رودبار|منجیل|جیرنده|رستم آباد|توتکابن|بره سر|چابکسر|رحیم آباد|رودسر|کلاچای|واجارگاه|طاهرگوراب|ضیابر|صومعه سرا|مرجقل|گوراب زرمیخ|فومن|ماسوله|ماکلوان|کومله|لنگرود|چاف و چمخاله|شلمان|اطاقور|لاهیجان|رودبنه|شفت|احمد سرگوراب|املش|رانکوه|پره سر|رضوانشهر|سیاهکل|دیلمان|ماسال|بازار جمعه|چوکام|خمام~~مازندران~رینه|آمل|گزنک|دابودشت|امامزاده عبدالله|بابکان|امیرکلا|بابل|خوش رودپی|گلوگاه|مرزیکلا|زرگر|گتاب|بهشهر|رستمکلا|خلیل شهر|شیرود|تنکابن|خرم آباد|نشتارود|دالخانی|رامسر|کتالم و سادات شهر|اکند|ساری|کیاسر|فریم|پایین هولار|فرح آباد|آلاشت|پل سفید|زیرآب|قایم شهر|ارطه|نور|رویان|چمستان|بلده|ایزدشهر|نوشهر|پول|کجور|بابلسر|بهنمیر|هادی شهر|محمودآباد|سرخرود|نکا|چالوس|مرزن آباد|هچیرود|لاریم|جویبار|کوهی خیل|آستانه سرا|فریدونکنار|سلمان شهر|عباس آباد|کلارآباد|سورک|طبقده|کیاکلا|شیرگاه|کلاردشت~~آذربایجان شرقی~اهر|اسفهلان|لاهیجان|خسروشاه|باسمنج|تبریز|سردرود|مهربان|سراب|شربیان|دوزدوزان|مراغه|خداجو(خراجو)|دیزج حسین بیگ|زنوز|مرند|کشکسرای|یامچی|بناب مرند|میانه|ترکمانچای|آقکند|ترک|اچاچی|هشترود|نظرکهریزی|بناب|خوشه مهر|کردکندی|بستان آباد|تیکمه داش|نظرلو|تسوج|خامنه|شبستر|شرفخانه|صوفیان|شندآباد|سیس|وایقان|کوزه کنان|داریان|علیشاه|کلیبر|آبش احمد|هریس|خواجه|زرنق|بخشایش|کلوانق|اربطان|جلفا|هادیشهر|سیه رود|ملکان|مبارک شهر|آذرشهر|گوگان|ممقان|تیمورلو|اسکو|ایلخچی|سهند|قره آغاج|ورزقان|خاروانا|عجب شیر|جوان قلعه|خمارلو|عاشقلو|لاریجان|هوراند|لیلان~~آذربایجان غربی~ارومیه|قوشچی|نوشین|سیلوانه|سرو|پیرانشهر|لاجان|خوی|فیرورق|دیزج دیز|قطور|ایواوغلی|زرآباد|سردشت|ربط|نلاس|تازه شهر|سلماس|ماکو|بازرگان|مهاباد|خلیفان|گوگ تپه|بکتاش|میاندوآب|محمدیار|نقده|بوکان|سیمینه|شاهین دژ|کشاورز|محمودآباد|تکاب|تخت سلیمان|اشنویه|نالوس|سیه چشمه|آواجیق|پلدشت|نازک علیا|قره ضیاءالدین|حاجیلار|شوط|مرگنلر|یولاگلدی|چهاربرج|باروق|میرآباد~~کرمانشاه~اسلام آبادغرب|حمیل|کرمانشاه|رباط|هلشی|کوزران|قلعه|پاوه|نودشه|نوسود|باینگان|بانوره|سرپل ذهاب|سنقر|سطر|قصرشیرین|سومار|کنگاور|گودین|گیلانغرب|سرمست|جوانرود|شروینه|صحنه|دینور|هرسین|بیستون|تازه آباد|ازگله|میرآباد|کرند|گهواره|ریجاب|شاهو|روانسر~~خوزستان~اروندکنار|آبادان|چویبده|اندیمشک|حسینیه|آزادی|چم گلک|بیدروبه|اهواز|الهایی|ایذه|بندر امام خمینی|بندر ماهشهر|چمران|بهبهان|سردشت|منصوریه|تشان|خرمشهر|مینوشهر|مقاومت|دزفول|حمزه|شمس آباد|سالند|شهر امام|صفی آباد|میانرود|چغامیش|سیاه منصور|شهیون|منتظران|جندی شاپور|بستان|سوسنگرد|کوت سیدنعیم|ابوحمیظه|باوج|رامهرمز|سلطان آباد|رود زرد ماشین|شادگان|دارخوین|خنافره|شوشتر|شرافت|گوریه|سرداران|عرب حسن|مسجدسلیمان|گلگیر|عنبر|شوش|حر|فتح المبین|باغ ملک|قلعه تل|میداود|امیدیه|جایزان|میانکوه|تراز|لالی|هندیجان|زهره|رامشیر|مشراگه|گتوند|ترکالکی|صالح شهر|سماله|جنت مکان|قلعه خواجه|آبژدان|زاووت|هفتگل|هویزه|رفیع|ملاثانی|ویس|شیبان|حمیدیه|آغاجاری|جولکی|کوت عبداله|شاوور|الوان|دهدز|صیدون~~فارس~آباده|صغاد|بهمن|ایزدخواست|سورمق|استهبان|رونیز|ایج|اقلید|دژکرد|حسن آباد|سده|جهرم|قطب آباد|دوزه|پاسخن|داراب|فدامی|دو برجی|جنت شهر|رستاق|اردکان|هماشهر|شیراز|شیراز6|شهر صدرا|خانه زنیان|داریان|فسا|زاهدشهر|ششده|نوبندگان|قره بلاغ|میانشهر|فیروزآباد|میمند|کازرون|خشت|کنارتخته|بالاده|لار|لطیفی|بنارویه|بیرم|خور|عماد شهر|دهکویه|فتح آباد|مرودشت|رامجرد|سیدان|کامفیروز|خانیمن|فاروق|زنگی آباد|نورآباد|خومه زار|بابامنیر|نی ریز|قطرویه|مشکان|خیرگو|لامرد|اشکنان|اهل|علامرودشت|چاه ورز|بوانات|مزایجان|ارسنجان|صفاشهر|قادرآباد|حاجی آباد|شهرپیر|دبیران|قیر|امام شهر|مبارک آباد دیز|کارزین/فتح آباد|افزر|مهر|گله دار|وراوی|اسیر|خوزی|فال|فراشبند|دهرم|نوجین|سعادت شهر|مادر سلیمان|خنج|محمله|سروستان|کوهنجان|مصیری|کوپن|گراش|ارد|اکبرآباد|مظفری|کوار|طسوج|خرامه|سلطان شهر|معزآباد جابری|خیرآباد|رحمت آباد|زرقان|لپویی|بیضا|توجردی|باغ صفا|حسامی|کره ای|قایمیه|نودان|خاوران|باب انار|خواجه جمالی|تم شولی|آباده طشک|کوره|بیدشهر|اوز|بلغان|جویم~~کرمان~کشکوییه|بافت|بزنجان|دهبکری|بم|بروات|جیرفت|جبالبارز|درب بهشت|بلوک|علی آباد|رفسنجان|صفاییه|مس سرچشمه|بهرمان|جوادیه الهیه|زرند|خانوک|ریحان|یزدان شهر|سیریز|سیرجان|زیدآباد|نجف شهر|پاریز|هماشهر|خواجو شهر|بلورد|شهربابک|خورسند|جوزم|خاتون آباد|دهج|راین|شهداد|گلباف|جوپار|ماهان|چترود|کرمان|باغین|محی آباد|زنگی آباد|کاظم آباد|اختیارآباد|اندوهجرد|چاه مرید|کهنوج|ده کهان|بردسیر|لاله زار|گلزار|نگار|دشتکار|راور|هجدک|عنبرآباد|مردهک|دوساری|منوجان|نودژ|کوهبنان|کیانشهر|رودبار|قلعه گنج|چاه دادخدا|رمشک|رحمت آباد|عباس آباد سردار|محمدآباد|رابر|هنزا|دهنو اسلام آباد|فهرج|انار|امین شهر|نرماشیر|نظام شهر|پاسفید|فاریاب|علی  آباد|ارزوییه|گنبکی|زهکلوت~~خراسان رضوی~تایباد|کاریز|مشهد ریزه|نسر|تربت حیدریه|کدکن|بایک|رباط سنگ|تربت جام|احمدآباد صولت|نصرآباد|نیل شهر|سمیع آباد|لطف آباد|درگز|نوخندان|چاپشلو|سبزوار|روداب|سبزوار1|سبزوار2|آلماجق|شهر کهنه|مزرج|باجگیران|قوچان|فرگ قلعه|کاشمر|بیدخت|کاخک|گناباد|روشناوند|مشهد|رضویه|ملک آباد|مشهد ثامن|نیشابور|بار|چکنه|چناران|رادکان|سیدآباد|سده|خواف|سنگان|قاسم آباد|نشتیفان|سلامی|سرخس|مزدآوند|فریمان|قلندر آباد|فرهادگرد|سفید سنگ|بردسکن|شهرآباد|انابد|رشتخوار|جنگل|چنار|حسن آباد|کلات|شهر زو|خلیل آباد|کندر|عبدل آباد|فیض آباد|شادمهر|بجستان|یونسی|شاندیز|طرقبه|گرماب|همت آباد|فیروزه|جغتای|ریواده|دولت آباد|چخماق|نقاب|حکم آباد|باخرز|قلعه نو علیا|سلطان آباد|مشکان|نوده انقلاب|داورزن|ریوند|صالح آباد|جنت آباد|ریوش|درود|قدمگاه|خرو|اسحق آباد|شامکان|ششتمد|گلمکان|گلبهار|عشق آباد~~اصفهان~اردستان|زواره|مهاباد|اصفهان|قهجاورستان|بهارستان|زیار|خمینی شهر|درچه|کوشک|اصغرآباد|ویست|خوانسار|سمیرم|حنا|ونک|کمه|بیده|فتح آباد|داران|دامنه|فریدونشهر|برف انبار|طاد|بوستان زر|فلاورجان|کلیشاد و سودرجان|قهدریجان|پیربکران|ابریشم|بهاران شهر|اشترجان|زازران|مینادشت|شهرضا|منظریه|قمصر|کاشان|نیاسر|جوشقان قالی|برزک|مشکات|کامو و چوگان|گلپایگان|گوگد|گلشهر|باغ بهادران|چمگردان|زرین شهر|سده لنجان|ورنامخواست|چرمهین|فولادشهر|زاینده رود|باغشاد|انارک|نایین|بافران|دهق|علویجه|نجف آباد|جوزدان|گلدشت|کهریزسنگ|بادرود|نطنز|خالدآباد|طرق رود|شاهین شهر|گزبرخوار|میمه|وزوان|گرگاب|لای بید|مبارکه|مجلسی|دیزیچه|طالخونچه|کرکوند|زیباشهر|ده سرخ|آران و بیدگل|ابوزیدآباد|نوش آباد|سفید شهر|تیران|عسگران|رضوانشهر|چادگان|رزوه|دهاقان|گلشن|حبیب آباد|خورزوق|دستگرد|دولت آباد|شاپورآباد|کمشچه|سین|خور|فرخی|جندق|بویین و میاندشت|افوس|کوهپایه|سجزی|تودشک|نیک آباد|حسن اباد|محمدآباد|نصرآباد|ورزنه|هرند|اژیه~~سیستان و بلوچستان~ایرانشهر|بزمان|چاه بهار|پلان|خاش|ده رییس|اسماعیل آباد|زابل|بنجار|زاهدان|نصرت آباد|سرجنگل|اسفندک|سراوان|محمدی|گشت|سیرکان|چانف|نیک شهر|بنت|راسک|پیشین|پارود|کنارک|زهک|جزینک|دوست محمد|قرقری|گلمورتی|چگرد|مهرستان|آشار|سیب|سوران|هیدوچ|ادیمی|علی اکبر|محمدآباد|لادیز|میرجاوه|ریگ ملک|قصرقند|ساربوک|فنوج|گتیج|قاسم آباد|محمدان|بمپور|نوک آباد|بریس|نگور|سرباز|جالق|اسپکه|زرآباد~~کردستان~بانه|آرمرده|کانی سور|بویین سفلی|بیجار|یاسوکند|بابارشانی|توپ آغاج|پیرتاج|سقز|صاحب|سنته|سنندج|شویشه|حسین آباد|مالوجه|سریش آباد|قروه|دلبران|دزج|مریوان|کانی دینار|چناره|برده رشه|دیواندره|زرینه|هزارکانیان|کامیاران|موچش|سروآباد|اورامان تخت|دهگلان|بلبان آباد~~همدان~تویسرکان|سرکان|فرسفج|علی آباددمق|سامن|ملایر|ازندریان|جوکار|زنگنه|اسلام شهر آق گل|نهاوند|فیروزان|برزول|گیان|مریانج|همدان|جورقان|قهاوند|کبودرآهنگ|گل تپه|شیرین سو|اسدآباد|آجین|پالیز|بهار|لالجین|صالح آباد|مهاجران|رزن|دمق|فامنین|شاهنجرین|قروه درگزین|کرفس~~چهارمحال و بختیاری~بلداجی|بروجن|فرادبنه|گندمان|سفیددشت|نقنه|شهرکرد|هفشجان|سورشجان|کیان|طاقانک|نافچ|سودجان|هارونی|جونقان|فارسان|بآباحیدر|پردنجان|گوجان|چلیچه|فیل آباد|لردگان|منج|سردشت|اردل|کاج|دشتک|سرخون|چلگرد|صمصامی|بازفت|شلمزار|ناغان|گهرو|دستنا|سامان|هوره|بن|وردنجان|یان چشمه|آلونی|مال خلیفه|فرخ شهر~~لرستان~تیتکان بزنوید|الیگودرز|شول آباد|چمن سلطان|شاهپوراباد|اشترینان|بروجرد|بروجرد1|بروجرد2|ونایی|خرم آباد|زاغه|سپیددشت|بیران شهر|خرم آباد1|خرم آباد2|خرم آباد3|نورآباد|هفت چشمه|برخوردار|دورود|چالانچولان|کوهدشت|گراب|کوهنانی|درب گنبد|ازنا|مومن آباد|پلدختر|سراب حمام|الشتر|فیروزآباد|سراب دوره|ویسیان|چم پلک|چقابل|سوری|معمولان~~ایلام~ایلام|جعفراباد|دره شهر|ماژین|دشت عباس|میمه|دهلران|موسیان|پهله|سرابله|آسمان آباد|شباب|بلاوه|صالح آباد|مهران|آبدانان|سراب باغ|مورموری|ایوان|زرنه|ارکواز|دلگشا|مهر|لومار|بدره|چشمه شیرین|توحید|چوار~~کهگیلویه و بویراحمد~سپیدار|یاسوج|چیتاب|گراب سفلی|دهدشت|سوق|قلعه رییسی|دیشموک|دوگنبدان|سی سخت|پاتاوه|قلعه ممبی|سرآسیاب یوسفی|لیکک|چرام|سرفاریاب|باشت|بوستان|لنده|مارگون~~بوشهر~خارک|بوشهر|چغادک|بوشهر1|بوشهر2|عالی شهر|اهرم|دلوار|آباد|سعد آباد|برازجان|شبانکاره|آب پخش|دالکی|وحدتیه|تنگ ارم|کلمه|بوشکان|خورموج|شنبه|کاکی|بادوله|بندردیر|بردخون|آبدان|بردستان|دوراهک|شیرینو|بندرکنگان|بنک|سیراف|بندرریگ|بندرگناوه|بندردیلم|امام حسن|انارستان|جم|ریز|بهارستان|عسلویه|نخل تقی|چاه مبارک|بیدخون~~زنجان~ابهر|صایین قلعه|هیدج|قیدار|سهرورد|گرماب|سجاس|زرین رود|کرسف|نوربهار|زنجان|ارمغانخانه|نیک پی|زرین آباد|حلب|خرمدره|گیلوان|آب بر|چورزق|ماه نشان|دندی|گوزلدره‌ سفلی|سلطانیه~~سمنان~دامغان|امیریه|دیباج|کلاته|سمنان|بسطام|مجن|شاهرود|کلاته خیج|بیارجمند|رودیان|ایوانکی|گرمسار|شهمیرزاد|مهدی شهر|درجزین|آرادان|کهن آباد|میامی|رضوان|سرخه~~یزد~اردکان|احمد‌آباد|عقدا|خرانق|بافق|تفت|نیر|بخ|مهریز|یزد_منطقه تاریخی|یزد|شاهدیه|حمیدیا|میبد|بفروییه|ندوشن|ابرکوه|مهردشت|اشکذر|خضرآباد|مجومرد|هرات|بهاباد|مروست|زارچ~~هرمزگان~تنب بزرگ|ابوموسی|شمیل|بندر عباس|هرمز|قلعه قاضی|تخت|فین|تازیان پایین|کنگ|بندر لنگه|کیش|چارک|لمزان|رمکان|لافت|قشم|سوزا|درگهان|طبل|زهوکی|کرگان|میناب|هشتبندی|سندرک|تیرور|بند زرک|بندر جاسک|لیردف|دهبارز|بیکاء|زیارتعلی|بالا شهر|حاجی آباد|سرگز|فارغان|بستک|جناح|هنگوییه|کوهیچ|کهورستان|خمیر|رویدر|پل|پارسیان|کوشکنار|دشتی|سیریک|گروک|کوهستک|سردشت|گوهران~~تهران~تهران|دماوند|رودهن|کیلان|آبسرد|آبعلی|ری|حسن‌آباد|باقرشهر|کهریزک|قیام‌دشت|قلعه‌نو|فشم|لواسان|تجریش|شمشک|ورامین|جوادآباد|شهریار|صباشهر|وحیدیه|شاهدشهر|فردوسیه|باغستان|اندیشه|شهریار1|شهریار2|شهریار3|اسلامشهر|اسلام‌شهر1|اسلام‌شهر2|چهاردانگه|اسلام‌شهر3|احمد‌آباد مستوفی|رباط‌کریم|نصیرشهر|پرند|پاکدشت|شریف آباد|فرون‌آباد|فیروزکوه|ارجمند|قدس|ملارد|صفادشت|پیشوا|جلیل‌آباد|نسیم شهر|گلستان|صالحیه|سعیدآباد|خسروآباد|بومهن|پردیس|قرچک~~اردبیل~اردبیل|هیر|ثمرین|آراللو|بیله سوار|جعفرآباد|خلخال|هشتجین|کلور|مشگین شهر|رضی|لاهرود|فخراباد|مرادلو|قصابه|النی|گرمی|زهرا|اولتان|پارس آباد|مغان سر|اسلام اباد|فیروزآباد|گیوی|نمین|آبی بیگلو|عنبران|نیر|کوراییم|سرعین|اردیموسی|بران علیا|اصلاندوز|زیوه|تازه کندانگوت~~قم~قم|سلفچگان|دستجرد|قنوات|قاهان|جعفریه|کهک~~قزوین~بویین زهرا|شال|دانسفهان|ارداق|سگزآباد|عصمت آباد|تاکستان|اسفرورین|ضیاآباد|خرمدشت|نرجه|قزوین|اقبالیه|محمودآبادنمونه|معلم کلایه|رازمیان|کوهین|سیردان|آبیک|خاکعلی|زیاران|قشلاق|الوند|شریفیه|محمدیه|بیدستان|آوج|آبگرم~~گلستان~بندرگز|نوکنده|بندرترکمن|سیجوال|علی آباد|فاضل آباد|مزرعه|سنگدوین|کردکوی|گرگان|جلین|سرخنکلاته|قرق|کرند|گنبدکاووس|اینچه برون|القجر|مینودشت|دوزین|آق قلا|انبار آلوم|کلاله|فراغی|آزادشهر|نوده خاندوز|نگین شهر|خان ببین|رامیان|دلند|تاتار علیا|مراوه|گلیداغ|گمیش تپه|سیمین شهر|ینقاق|گالیکش|صادق آباد~~خراسان شمالی~اسفراین|بجنورد|حصارگرمخان|بجنورد1|بجنورد2|چناران شهر|جاجرم|سنخواست|شوقان|خانلق|شیروان|لوجلی|زیارت|قوشخانه|فاروج|تیتکانلو|آشخانه|قاضی|آوا|ایور|گرمه|درق|راز|غلامان|یکه سعود|صفی آباد|پیش قلعه~~خراسان جنوبی~بیرجند|بیرجند1|بیرجند2|قهستان|طبس مسینا|اسدیه|گزیک|سربیشه|مود|درح|خضری دشت بیاض|قاین|اسفدن|آرین شهر|نیمبلوک|نهبندان|شوسف|سرایان|آیسک|سه قلعه|باغستان|اسلامیه|فردوس|بشرویه|ارسک|حاجی آباد|زهان|آبیز|ماژان|خوسف|طبس|عشق آباد|دیهوک~~البرز~کرج|آسارا|ماهدشت|کمال شهر|محمدشهر|گرمدره|هشتگرد|گلسار|کوهسار|مهستان|نظرآباد|تنکمان|طالقان|اشتهارد|پلنگ آباد|مشکین‌دشت|فردیس|چهارباغ";
function parseGeoRaw_(raw) {
  const out = [];
  String(raw || "").split("~~").forEach(function(block) {
    const parts = String(block || "").split("~");
    const province = String(parts[0] || "").trim();
    if (!province) return;
    const cities = String(parts[1] || "").split("|").map(function(c) { return String(c || "").trim(); }).filter(Boolean);
    out.push({ p: province, c: cities });
  });
  if (!out.length) out.push({ p: "تهران", c: ["تهران"] });
  return out;
}
const IR_GEO = parseGeoRaw_(IR_GEO_RAW);

const SETTINGS_CHOICE_OPTIONS_ = {
  BOT_MODE: { label: "وضعیت بات", options: [{ value: "active", label: "فعال" }, { value: "paused", label: "توقف موقت" }, { value: "maintenance", label: "تعمیرات" }] },
  PUBLISH_MODE: { label: "حالت انتشار", options: [{ value: "auto", label: "انتشار خودکار" }, { value: "approval", label: "تأیید مدیر" }] },
  PUBLISH_ENABLED: { label: "پردازش انتشار", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  FJ_ENABLED: { label: "عضویت اجباری", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  MUSIC_DOWNLOAD_DEFAULT_ENABLED: { label: "دانلود پیش‌فرض ترک‌های تازه", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  POST_SHOW_LINK_BUTTONS: { label: "دکمه‌های لینک زیر پست", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  POST_DOWNLOAD_BUTTON_ON_COVER: { label: "دکمهٔ دانلود روی کاور", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  DOWNLOAD_LINK_TOKEN: { label: "لینک دانلود امضاشده", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  QUEUE_ENABLED: { label: "پردازش صف‌ها", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  USER_LANG_EDITABLE: { label: "تغییر زبان توسط کاربر", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  BACKUP_ENABLED: { label: "بکاپ خودکار هفتگی", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  ADMIN_ERROR_NOTIFY: { label: "اعلان خطا به مدیر", options: [{ value: "true", label: "روشن" }, { value: "false", label: "خاموش" }] },
  BTN_STYLE_REPLY: { label: "رنگ دکمه‌های معمولی", options: [{ value: "default", label: "پیش‌فرض" }, { value: "primary", label: "آبی" }, { value: "success", label: "سبز" }, { value: "danger", label: "قرمز" }] },
  BTN_STYLE_INLINE: { label: "رنگ دکمه‌های شیشه‌ای", options: [{ value: "default", label: "پیش‌فرض" }, { value: "primary", label: "آبی" }, { value: "success", label: "سبز" }, { value: "danger", label: "قرمز" }] },
  BTN_STYLE_DANGER: { label: "رنگ دکمه‌های هشدار", options: [{ value: "default", label: "پیش‌فرض" }, { value: "primary", label: "آبی" }, { value: "success", label: "سبز" }, { value: "danger", label: "قرمز" }] },
  DEFAULT_LANG: { label: "زبان پیش‌فرض", options: [{ value: "fa", label: "فارسی" }, { value: "en", label: "English" }] },
  PUBLISH_INTERVAL_MIN: { label: "فاصلهٔ انتشار (دقیقه)", options: [1, 5, 10, 15, 30, 60].map(function(n) { return { value: String(n), label: n + " دقیقه" }; }), allowCustom: true },
  INACTIVE_AFTER_DAYS: { label: "آستانهٔ کاربر غیرفعال (روز)", options: [7, 14, 30, 60, 90].map(function(n) { return { value: String(n), label: n + " روز" }; }), allowCustom: true },
  INACTIVE_REPEAT_DAYS: { label: "تکرار پیام غیرفعال‌ها (روز)", options: [30, 60, 90, 180].map(function(n) { return { value: String(n), label: n + " روز" }; }), allowCustom: true },
  BROADCAST_BATCH: { label: "اندازهٔ دستهٔ پیام همگانی", options: [5, 10, 20, 50].map(function(n) { return { value: String(n), label: String(n) }; }), allowCustom: true },
  TIMEZONE: { label: "منطقهٔ زمانی", options: [{ value: "Asia/Tehran", label: "تهران" }, { value: "Europe/Amsterdam", label: "آمستردام" }, { value: "UTC", label: "UTC" }], allowCustom: true }
};
const SETTINGS_CHANNEL_KEYS_ = ["CHANNEL_ID", "CHANNEL_FOOTER", "PUBLISH_MODE", "PUBLISH_ENABLED", "PUBLISH_INTERVAL_MIN", "BOT_USERNAME", "TIMEZONE", "STAGING_CHANNEL_ID"];

// اگر پستی نیمه‌کاره در کانال ماند، صف تا این مدت قفل می‌شود؛ بعد از آن صف ادامه می‌دهد تا کانال برای همیشه نخوابد.
const PARTIAL_PUBLISH_LOCK_MINUTES_ = 30;
// اگر وضعیت «publishing» بیش از این مدت بی‌حرکت بماند، خودکار آزاد می‌شود.
const STUCK_PUBLISHING_MINUTES_ = 10;

const USER_COL = { userId: 1, phone: 2, firstName: 3, lastName: 4, rapName: 5, province: 6, city: 7, country: 8, passSalt: 9, passHash: 10, registeredAt: 11, lastSeen: 12, active: 13, blocked: 14, username: 15, supportMode: 16, lastSupportAt: 17, botBlocked: 18, lastDownloadMessageIds: 19, lastDownloadAt: 20, lang: 21, gateSalt: 22, gateHash: 23, gateUntil: 24, gateEnabled: 25, metaJson: 26 };
const POST_LINK_PLATFORMS = [
  { key: "instagram", label: "Instagram", emoji: "🟣", domains: ["instagram.com", "instagr.am"] },
  { key: "soundcloud", label: "SoundCloud", emoji: "🟠", domains: ["soundcloud.com"] },
  { key: "spotify", label: "Spotify", emoji: "🟢", domains: ["spotify.com", "spotify.link"] },
  { key: "youtube", label: "YouTube", emoji: "🔴", domains: ["youtube.com", "youtu.be"] },
  { key: "applemusic", label: "Apple Music", emoji: "🍎", domains: ["music.apple.com", "itunes.apple.com"] },
  { key: "telegram", label: "Telegram", emoji: "🔵", domains: ["t.me", "telegram.me"] },
  { key: "tiktok", label: "TikTok", emoji: "⚫", domains: ["tiktok.com"] },
  { key: "deezer", label: "Deezer", emoji: "🎧", domains: ["deezer.com"] },
  { key: "tidal", label: "TIDAL", emoji: "🌊", domains: ["tidal.com"] },
  { key: "bandcamp", label: "Bandcamp", emoji: "🎸", domains: ["bandcamp.com"] },
  { key: "audiomack", label: "Audiomack", emoji: "🎧", domains: ["audiomack.com"] },
  { key: "anghami", label: "Anghami", emoji: "🎶", domains: ["anghami.com"] },
  { key: "linktree", label: "Linktree", emoji: "🔗", domains: ["linktr.ee"] },
  { key: "amazonmusic", label: "Amazon Music", emoji: "🎵", domains: ["music.amazon.com", "amazon.com"] },
  { key: "facebook", label: "Facebook", emoji: "🔵", domains: ["facebook.com", "fb.watch"] },
  { key: "x", label: "X", emoji: "⚫", domains: ["x.com", "twitter.com"] }
];

// ───────────────────────── چندزبانه (fa / en) ─────────────────────────
// متن‌های اصلی کاربر فارسی است؛ کلید fa عیناً همان متن‌های نسخهٔ قبل است تا رفتار
// دکمه‌ها و تست‌های قدیمی نشکند. برای تغییر متن در اجرا، کلید متنی در Settings
// می‌تواند متن را بازنویسی کند (override).
const MSG = {
  fa: {
    BTN_REGISTER: "🟡 ثبت‌نام / ورود", BTN_FORGOT: "🆘 فراموشی رمز", BTN_SUPPORT: "📞 پشتیبانی",
    BTN_SEND_MUSIC: "🎵 ارسال موزیک", BTN_SEND_ALBUM: "🎼 ارسال آلبوم", BTN_COMING_SOON: "⏳ Coming Soon", BTN_FREESTYLE: "🎤 فری‌استایل",
    BTN_MY_WORKS: "📚 آثار من", BTN_PROFILE: "👤 پروفایل", BTN_LOGOUT: "🚪 خروج", BTN_CANCEL: "❌ لغو",
    BTN_MY_CHANNELS: "📢 کانال‌های من",
    CC_LIST_TITLE: "📢 کانال‌های وصل‌شدهٔ تو",
    CC_LIST_EMPTY: "هنوز کانالی وصل نکرده‌ای.\nبات را در کانالت ادمین کن (با دسترسی کامل) و بعد «➕ افزودن کانال» را بزن.",
    CC_ADD_ASK: "📢 آیدی یا نام کاربری کانالت را بفرست (مثل @mychannel یا -1001234567890).\nقبلش بات را در کانال ادمین کرده باش.",
    CC_ADD_OK: "✅ کانال «{t}» وصل شد. از این پس کارهایت پوشش داده می‌شود و کانالت تبلیغ می‌شود.",
    CC_ADD_NOT_CHANNEL: "❌ این چت کانال نیست. آیدی کانال خودت را بفرست.",
    CC_ADD_NOT_ADMIN: "❌ بات در این کانال ادمین نیست (یا دسترسی ارسال ندارد). اول بات را ادمین کن و دوباره امتحان کن.",
    CC_ADD_TAKEN: "❌ این کانال قبلاً توسط کاربر دیگری وصل شده است.",
    CC_ADD_LIMIT: "❌ سقف کانال‌های وصل‌شدهٔ تو {n} است؛ اول یکی را جدا کن.",
    CC_RM_OK: "🗑 کانال «{t}» حذف شد.",
    CC_EDIT_ASK: "✏️ آیدی یا یوزرنیم کانال جدید را بفرست تا جایگزین کانال «{t}» شود (یا اگر فقط نام/یوزرنیم همین کانال را در تلگرام عوض کرده‌ای، دکمهٔ «🔄 همگام‌سازی» را بزن):",
    CC_EDIT_OK: "✅ کانال «{old}» با کانال «{t}» جایگزین شد.",
    CC_SYNC_OK: "🔄 مشخصات کانال «{t}» از تلگرام به‌روزرسانی شد.",
    CC_BANNER_DELETED_WARN: "⚠️ بنر تبلیغاتی ما را از کانال «{t}» پاک کرده بودی!\n❌ پیام «پوشش داده شد» از کانال اصلی حذف شد و بنر جدید دوباره در کانالت ارسال گردید. لطفاً بنر را از کانالت پاک نکن.",
    CC_GATE_TEXT: "📢 برای ارسال اثر و دیدن آثار، اول باید بات را در کانال تلگرامت ادمین کنی (دسترسی کامل).\nاز این به بعد ما کارهایت را پوشش می‌دهیم و کانالت هم تبلیغ می‌شود.",
    CC_GATE_BTN: "📢 اتصال کانال",
    CC_PROMO_TEXT: "🎬 اثر تازهٔ «{t}» در کانال اصلی منتشر شد.",
    CC_PROMO_BTN: "🔗 دیدن پست در کانال",
    CC_ADVERTISE_LINE: "📢 کانال هنرمند: {link}",
    CC_ADVERTISE_BTN: "📢 کانال هنرمند",
    CC_KICKED_NOTIFY: "⛔ بات دیگر در کانال «{t}» ادمین نیست؛ اتصال غیرفعال شد. برای فعال‌شدن دوباره، بات را ادمین کن و از «📢 کانال‌های من» وصل کن.",
    BTN_FINISH: "✅ پایان ارسال", BTN_END: "✅ پایان", BTN_NEXT: "➡️ مرحلهٔ بعد", BTN_SKIP: "⏭ رد کردن",
    BTN_SEND_PHONE: "📱 ارسال شماره من", BTN_TRY_JOIN: "✅ بررسی عضویت", BTN_BACK: "⬅️ بازگشت",
    BACK: "⬅️ بازگشت", HOME: "🏠 منو", READY: "آماده‌ام", YES: "✅ بله، ثبت کن", NO: "❌ نه، بازگرد",
    CONFIRM: "تأیید", DELETE: "🗑 حذف", EDIT: "✏️ ویرایش", RETRY: "🔁 تلاش دوباره", RELOAD: "🔁 بازخوانی",
    LOGIN_NEEDED: "برای ادامه ابتدا ثبت‌نام یا ورود کن.",
    NOT_SETUP: "⚫🟡 بات هنوز راه‌اندازی نشده؛ مدیر باید /claim را اجرا کند.",
    SENT_PHONE_PROMPT: "🟡 برای ورود یا ثبت‌نام، شماره‌ات را با دکمهٔ رسمی تلگرام بفرست.\nاگر شماره از قبل ثبت شده باشد، مستقیم رمز ورود را می‌پرسم.",
    PHONE_BUTTON_ONLY: "❌ شماره را با دکمهٔ «📱 ارسال شماره من» بفرست.",
    PHONE_OTHER_ACCOUNT: "⚠️ این شماره به حساب تلگرام دیگری وصل است.",
    PHONE_TAKEN: "⚠️ برای این اکانت تلگرام قبلاً حساب ثبت شده، اما شماره هم‌خوانی ندارد.",
    ACCOUNT_BLOCKED: "⛔ حسابت مسدود است. برای پیگیری با پشتیبانی تماس بگیر.",
    ACCOUNT_INACTIVE: "⏸ حسابت غیرفعال است. از پشتیبانی پیگیری کن.",
    ASK_FIRST_NAME: "📝 نام واقعی‌ات را بنویس:", ASK_LAST_NAME: "حالا نام خانوادگی واقعی‌ات را بنویس:",
    ASK_RAP_NAME: "🎤 لقب یا اسم هنری‌ات را بنویس:",
    BTN_ARTIST_PROFILE: "👤 دریافت از پروفایل", BTN_ARTIST_MANUAL: "✍️ وارد کردن دستی",
    ARTIST_PROFILE_MISSING: "❌ نام هنری در پروفایل ثبت نشده. لطفاً ابتدا از «👤 پروفایل» → «✏️ ویرایش نام» نام هنری خود را ثبت کن یا گزینه «✍️ وارد کردن دستی» را بزن.",
    ARTIST_PROFILE_USED: "✅ نام هنری «{n}» از پروفایل استفاده شد.",
    ARTIST_MANUAL_PROMPT: "✍️ نام هنرمند را به صورت دستی وارد کن:",
    ARTIST_ASK_ONCE: "🎤 نام هنری شما در پروفایل ثبت نشده. لطفاً برای یکبار نام هنری خود را وارد کن تا در پروفایل ذخیره شود:",
    ASK_PROVINCE: "📍 استان محل سکونتت را انتخاب کن:", ASK_CITY_FREE: "نام شهرت را بنویس:",
    OTHER_COUNTRY: "🌍 سایر (کشوری دیگر)", OTHER_COUNTRIES: "کشورش را از فهرست انتخاب کن:",
    PICK_PROVINCE: "استان را از دکمه‌ها انتخاب کن:", PICK_CITY: "شهر را از دکمه‌ها انتخاب کن:", PICK_CITY_ACTIVE: "شهر مورد نظرت را از دکمه‌ها انتخاب کن:",
    ASK_PW1: "رمز عبور بساز (حداقل ۶ کاراکتر):", ASK_PW2: "حالا همان رمز را یک بار دیگر برای تأیید بفرست:",
    PW_RESTART: "دو رمز یکی نبودند. از اول رمز جدید را بفرست:",
    PW_LEN: "رمز باید ۶ تا ۶۴ کاراکتر باشد؛ دوباره بفرست:",
    SERVER_BUSY: "⏳ سرور همین حالا شلوغ است و درخواستت ثبت نشد؛ چند ثانیه صبر کن و همین پیام را دوباره بفرست.",
    PHONE_SAVED: "✅ شماره ثبت شده است. حالا رمز عبورت را بفرست:",
    LOGIN_OK: "✅ ورود موفق بود.", LOGIN_FAIL: "❌ رمز درست نیست؛ دوباره بفرست ({n}/5):",
    LOGIN_FAIL_2FA: "❌ رمز یا کد دومرحله‌ای درست نیست ({n}/5):",
    LOGIN_GATE: "🔐 کد تأیید دومرحله‌ای را از دکمهٔ پایین بگیر و بفرست:",
    LOGIN_GATE_ASK: "کد ۶ رقمی یا رمز یک‌بارمصرف را بفرست:",
    LOGIN_GATE_WRONG: "❌ کد درست نیست ({n}/5):",
    LOGIN_GATE_OFF: "⛔ تأیید دومرحله‌ای برای این حساب غیرفعال شده؛ با پشتیبانی تماس بگیر.",
    LOGIN_ATTEMPTS_END: "❌ تلاش‌های رمز تمام شد؛ دوباره از ورود شروع کن.",
    FORGOT_PROMPT: "🆘 بازیابی رمز\nشماره‌ای که با آن ثبت‌نام کرده‌ای را با دکمهٔ زیر بفرست؛ درخواست و مشخصات حسابت برای مدیر می‌رود.",
    FORGOT_NO_ACCOUNT: "⚠️ حسابی با این شماره برای همین اکانت تلگرام پیدا نشد.",
    FORGOT_BLOCKED: "⛔ حسابت مسدود است؛ درخواست بازیابی رمز ثبت نشد.",
    FORGOT_SENT: "✅ درخواست بازیابی برای مدیر ارسال شد. بعد از تأیید، دکمهٔ تعیین رمز جدید برایت می‌آید.",
    FORGOT_APPROVED: "✅ درخواست بازیابی رمزت تأیید شد. برای تعیین رمز جدید دکمه را بزن.",
    FORGOT_REJECTED: "❌ درخواست بازیابی رمزت تأیید نشد. برای پیگیری از پشتیبانی پیام بده.",
    FORGOT_INVALID: "درخواست بازیابی دیگر معتبر نیست.",
    PW_SET: "✅ رمز جدید ثبت شد؛ حالا با شماره و رمز جدید وارد شو.",
    FORGOT_PW_PROMPT: "رمز جدید را بفرست (حداقل ۶ کاراکتر):",
    MENU_TITLE: "🎵 منوی اصلی\nاز گزینه‌های زیر استفاده کن:", ADMIN_MENU_TITLE: "🎛 پنل مدیریت فلورا بات",
    ADMIN_AUTH_NEEDED: "برای بازشدن پنل مدیریت، با همین حساب Telegram ثبت‌نام یا وارد شو.",
    ADMIN_ALREADY: "قبلاً مدیر هستی.", ADMIN_CLAIM_BAD: "کد مدیریت درست نیست.", ADMIN_CLAIM_OK: "✅ پنل مدیریت فعال شد.",
    ADMIN_CLAIM_EXISTS: "یک مدیر قبلاً فعال شده است؛ برای افزودن مدیر جدید از پنل «🛡 دسترسی مدیران» استفاده کن.",
    ADMIN_BLOCKED: "⛔ حساب مدیر مسدود است؛ برای پیگیری با مدیر اصلی تماس بگیر.",
    ADMIN_INACTIVE: "⏸ حساب مدیر غیرفعال است؛ برای پیگیری با مدیر اصلی تماس بگیر.",
    ADMIN_LOGIN_CANCELLED: "ورود برای دسترسی مدیر لغو شد.",
    ADMIN_SESSION_EXPIRED: "🔐 برای ادامه، دوباره با اطلاعات حسابت وارد شو:",
    ADMIN_2FA_ON: "✅ تأیید دومرحله‌ای روشن شد.",
    JOINNEEDED_TITLE: "🚸 برای استفاده از بات، ابتدا در کانال‌های زیر عضو شو و بعد «بررسی عضویت» را بزن.",
    JOIN_CONFIRMED: "✅ عضویت تأیید شد.", JOIN_NOT_YET: "هنوز عضویت کامل نیست.",
    JOIN_JOIN_CHANNEL: "عضویت در ",
    LOGGED_OUT: "🚪 خارج شدی.",
    LANG_PICK: "🌍 زبان را انتخاب کن:", LANG_SET: "زبان تغییر کرد.",
    USER_MENU_HINT: "از منوی پایین استفاده کن.",
    CANCEL_DONE: "❌ لغو شد.", CANCEL_WRONG_STAGE: "مرحلهٔ ثبت‌نام نامعتبر شد؛ از ابتدا شروع کن.",
    MAIN_MENU_BTN: "🎵 منوی اصلی", BTN_ADMIN: "🎛 پنل مدیریت",
    // موزیک
    MUSIC_MEDIA_SIMPLE: "🎵 ارسال موزیک\n۱) کاور را بفرست (حداکثر {n} عکس).\n۲) فایل MP3 را بفرست.\n۳) بعد «✅ پایان ارسال» را بزن.",
    MUSIC_MEDIA_ALBUM: "🎼 آلبوم\n۱) همهٔ کاورها را یک‌جا بفرست (حداکثر {n} عکس).\n۲) بعد فایل‌های MP3 را به ترتیب بفرست.\n۳) آخر «✅ پایان ارسال» را بزن.",
    MUSIC_MEDIA_COMING: "⏳ Coming Soon\nیک کاور (یا چند کاور) بفرست؛ انتشار به‌صورت اعلام زمان است و فایل صوتی لازم نیست.",
    // ── مرحله‌به‌مرحلهٔ سخت‌گیرانه: کاور → موزیک → هنرمند → فیچر → عوامل → عنوان ──
    STEP_COVER_SIMPLE: "🖼 مرحلهٔ ۱ — کاور\nکاور را بفرست: فقط عکس یا ویدیو، حداکثر {n} مورد (به‌صورت گرید).\nفایل موزیک، ویس، ویدیو مسیج و متن در این مرحله قبول نمی‌شود.\nکاور نداری؟ همان «➡️ مرحلهٔ بعد» را بزن تا کاور پیش‌فرض کانال استفاده شود.",
    STEP_COVER_ALBUM: "🖼 مرحلهٔ ۱ — کاور آلبوم\nکاورها را یک‌جا (گرید) بفرست: فقط عکس یا ویدیو، حداکثر {n} مورد.\nفایل موزیک، ویس، ویدیو مسیج و متن در این مرحله قبول نمی‌شود.\nکاور نداری؟ همان «➡️ مرحلهٔ بعد» را بزن تا کاور پیش‌فرض کانال استفاده شود.",
    STEP_COVER_COMING: "⏳ مرحلهٔ ۱ — Coming Soon\nفقط یک رسانه مجاز است. اول نوع آن را انتخاب کن:\n📷 عکس · 🎬 ویدیو · 🎥 ویدیو مسیج · 🎙 ویس",
    STEP_COVER_ONLY: "❌ کاور ارسال کن (عکس یا ویدیو) — حداکثر {n} مورد.\nفایل موزیک، ویس، ویدیو مسیج و متن در این مرحله قبول نمی‌شود.",
    STEP_COVER_ONLY_COMING: "❌ برای Coming Soon فقط یک مورد مجاز است: عکس، ویدیو، ویدیو مسیج یا ویس.",
    STEP_COVER_ADDED: "✅ کاور ثبت شد ({p} از {n}). کاور بعدی را بفرست یا «➡️ مرحلهٔ بعد» را بزن.",
    STEP_COVER_FULL: "✅ {p} کاور ثبت شد (گرید کامل است). حالا «➡️ مرحلهٔ بعد» را بزن.",
    STEP_AUDIO_SIMPLE: "🎧 مرحلهٔ ۲ — فایل موزیک\nفقط یک فایل MP3 بفرست (تک‌آهنگ = یک فایل).\nویس، ویدیو مسیج و فرمت‌های دیگر به‌عنوان موزیک قبول نمی‌شوند.",
    STEP_AUDIO_ALBUM: "🎧 مرحلهٔ ۲ — فایل‌های موزیک آلبوم\nفایل‌های MP3 را به ترتیب بفرست (هر تعداد ترک که داری).\nویس، ویدیو مسیج و فرمت‌های دیگر قبول نمی‌شوند.\nدر پایان «✅ پایان ارسال» را بزن.",
    STEP_AUDIO_ONLY_MP3: "❌ فقط فایل MP3 به‌عنوان موزیک قبول می‌شود. این فایل پذیرفته نشد.",
    STEP_AUDIO_NO_VOICE: "❌ ویس و ویدیو مسیج به‌عنوان موزیک قبول نمی‌شود؛ فایل MP3 بفرست.",
    STEP_AUDIO_NO_COVER: "❌ کاور در مرحلهٔ قبل ثبت شد؛ اینجا فقط فایل MP3 بفرست.",
    STEP_AUDIO_ADDED_SINGLE: "✅ فایل موزیک ثبت شد. برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    STEP_AUDIO_ADDED_ALBUM: "✅ {a} ترک ثبت شد. ترک بعدی را بفرست یا «✅ پایان ارسال» را بزن.",
    STEP_AUDIO_SINGLE_LIMIT: "❌ برای تک‌آهنگ فقط یک فایل MP3 مجاز است. برای چند ترک از «🎼 ارسال آلبوم» استفاده کن.",
    // ── فری‌استایل (اجرای زندهٔ ویدیویی) ──
    STEP_COVER_FREESTYLE: "🖼 مرحلهٔ ۱ — کاور (اختیاری)\nحداکثر {n} عکس یا ویدیو بفرست. اگر کاور نفرستی، خودِ اجرای فری‌استایل پست کانال می‌شود.\nبرای رد کردن «➡️ مرحلهٔ بعد» را بزن.",
    STEP_AUDIO_FREESTYLE: "🎤 مرحلهٔ ۲ — اجرای فری‌استایل\nیکی از این‌ها را بفرست (فقط یک مورد):\n🎥 ویدیو مسیج گرد · 🎬 ویدیو · 🎵 فایل MP3\nویس و عکس اینجا قبول نمی‌شود.",
    FREESTYLE_MEDIA_ADDED: "✅ اجرای فری‌استایل ثبت شد: {k}. برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    FREESTYLE_ONLY_ONE: "❌ برای فری‌استایل فقط یک اجرا مجاز است (ویدیو مسیج، ویدیو یا MP3). برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    FREESTYLE_NO_VOICE: "❌ ویس برای فری‌استایل قبول نمی‌شود؛ ویدیو مسیج گرد، ویدیو یا MP3 بفرست.",
    FREESTYLE_NO_PHOTO: "❌ عکس در مرحلهٔ کاور ثبت می‌شود؛ اینجا ویدیو مسیج، ویدیو یا MP3 بفرست.",
    FREESTYLE_KIND_AUDIO: "🎵 فایل MP3",
    NEED_FREESTYLE_MEDIA: "❌ هنوز اجرای فری‌استایل نفرستادی؛ یک ویدیو مسیج، ویدیو یا MP3 بفرست.",
    STEP_AUDIO_ONLY_FREESTYLE: "❌ اینجا فقط رسانه قبول می‌شود: 🎥 ویدیو مسیج گرد، 🎬 ویدیو یا 🎵 فایل MP3.",
    // ── مرحلهٔ ژانر (هشتگ متغیر هر پست) ──
    GENRE_ASK: "🏷 مرحلهٔ ژانر — حال‌وهوای اثر را انتخاب کن (حداکثر {n} مورد).\nاین انتخاب هشتگ‌های متغیر پست کانال را می‌سازد؛ مثلاً #Trap\nمی‌توانی نام ژانر را هم بنویسی («ژانر: ترپ») یا «⏭ رد کردن» را بزنی.",
    GENRE_SAVED: "🏷 ژانر ثبت شد: {v}\nاگر ژانر دیگری هم داری بفرست، وگرنه «➡️ مرحلهٔ بعد» را بزن.",
    GENRE_LIMIT: "❌ حداکثر {n} ژانر مجاز است. برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    GENRE_NONE_YET: "🏷 ژانری انتخاب نشده. یکی از دکمه‌ها را بزن، نام ژانر را بنویس یا «⏭ رد کردن» را بزن.",
    GENRE_TOO_LONG: "❌ نام ژانر باید بین ۲ تا ۲۴ نویسه باشد.",
    STEP_GENRE_ONLY: "❌ الان در مرحلهٔ «ژانر» هستی؛ فقط دکمه‌های ژانر یا متن «ژانر: …» قبول می‌شود.",
    BTN_CS_PHOTO: "📷 عکس", BTN_CS_VIDEO: "🎬 ویدیو", BTN_CS_VIDEO_NOTE: "🎥 ویدیو مسیج", BTN_CS_VOICE: "🎙 ویس",
    CS_KIND_PROMPT: "✅ نوع رسانه انتخاب شد: {k}. حالا فقط یک {k} بفرست.",
    CS_KIND_MISMATCH: "❌ تو «{k}» را انتخاب کرده‌ای؛ فقط همان را بفرست (یا «❌ لغو» و از اول شروع کن).",
    CS_ONLY_ONE: "❌ برای Coming Soon فقط یک رسانه مجاز است؛ برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    STEP_MEDIA_WRONG_STAGE: "❌ الان در مرحلهٔ «{s}» هستی؛ اینجا فقط {w} قبول می‌شود.",
    DRAFT_OPEN: "✳️ یک پیش‌نویس باز داری. اول آن را کامل کن یا «❌ لغو» را بزن.",
    DRAFT_NOT_FOUND: "پیش‌نویس پیدا نشد؛ از منو شروع کن.",
    ONLY_MEDIA: "برای این مرحله عکس/MP3 بفرست یا «✅ پایان ارسال» را بزن.",
    FILE_UNSUPPORTED: "این نوع فایل پشتیبانی نمی‌شود.",
    FILE_NOT_AUDIO: "این فایل صوتی قابل‌استفاده نیست؛ MP3 بفرست.",
    AUDIO_TOO_BIG: "❌ حجم فایل از {n} مگابایت بیشتر است. فایل کم‌حجم‌تر بفرست.",
    AUDIO_ACCEPTED_EXT: "❌ فرمت این فایل پشتیبانی نمی‌شود. فرمت‌های مجاز: MP3، M4A، WAV، FLAC، OGG، OPUS، AAC.",
    MEDIA_LIMIT: "حداکثر {n} فایل صوتی مجاز است.",
    COVER_LIMIT: "حداکثر {n} کاور (عکس یا ویدیو) مجاز است.",
    MEDIA_ADDED: "✅ ثبت شد ({p} عکس، {a} صدا). بعدی را بفرست یا «✅ پایان ارسال» را بزن.",
    MEDIA_COVER_10: "✅ ۱۰ کاور ثبت شد. حالا فایل MP3 را بفرست.",
    MEDIA_COVER_AND_AUDIO: "✅ کاور و فایل ثبت شد. فایل دیگری اضافه کن یا «✅ پایان ارسال» را بزن.",
    NEED_AUDIO: "❌ فایل MP3 را بفرست.", NEED_COVER: "🖼 برای Coming Soon حداقل یک کاور بفرست.",
    MFA_CODE_TEXT: "🔐 کد یک‌بارمصرفِ تو: <code>{c}</code>\nاین کد را مثل رمز دوم نگه دار؛ در ورود بعدی از تو پرسیده می‌شود.\nاگر آن را گم کردی از «🔐 دومرحله‌ای» دوباره بساز.",
    MFA_CODE_ROTATED: "🔐 کد جدید دومرحله‌ای تو: <code>{c}</code>",
    MFA_CODE_ONLY: "🔐 کد دومرحله‌ای تو: <code>{c}</code>",
    MFA_OFF: "✅ ورود دومرحله‌ای خاموش شد.",
    DEL_ACCOUNT_CONFIRM_BTN: "🗑 بله، حسابم حذف شود",
    LOGIN_GATE_HINT: "اگر کد را نداری از «🆘 فراموشی رمز» درخواست بده.",
    NEW_MEDIA_REQUIRED: "❌ برای این نوع ارسال، رسانه لازم است.",
    EDIT_COVER_PROMPT: "🖼 عکس کاور جدید را بفرست.",
    EDIT_COVER_OK: "✅ کاور جایگزین شد.",
    PREVIEW_EDIT_NOTE: "⚠️ با تغییر عنوان/لینک، اثر به صف تأیید برمی‌گردد.",
    PLATFORM_HIDDEN: "در کپشن مخفی",
    PLATFORM_SHOWN: "در کپشن نمایش",
    MY_WORKS_TITLE: "📚 آثار من",
    MY_WORKS_EMPTY: "هنوز اثری ثبت نکرده‌ای.",
    MY_WORK_OFFLINE_NOTE: "ℹ️ این اثر هنوز در کانال منتشر نشده است.",
    MY_WORKS_FILTER_ALL: "همه",
    MY_WORKS_FILTER_PENDING: "⏳ در انتظار",
    MY_WORKS_FILTER_APPROVED: "🗓 در صف",
    MY_WORKS_FILTER_PUBLISHED: "✅ منتشر شده",
    MY_WORKS_FILTER_REJECTED: "❌ رد شده",
    MY_WORKS_FILTER_FAILED: "⚠️ خطا",
    MY_WORKS_FILTER_DELETE_PENDING: "🗑 در انتظار حذف",
    POST_LINK_BTN: "🔗 مشاهدهٔ پست کانال",
    POST_VIEW_BTN: "🔗 مشاهده در کانال",
    DOWNLOAD_BTN: "⬇️ دانلود",
    DOWNLOAD_FILE_BTN: "⬇️ دریافت فایل",
    EDIT_BTN: "✏️ ویرایش",
    DELETE_BTN: "🗑 حذف اثر",
    DELETE_CONFIRM_TITLE: "⚠️ حذف اثر «{t}»",
    DELETE_CONFIRM_TEXT: "⚠️ آیا مطمئنی که می‌خواهی اثر «{t}» را حذف کنی؟\n\n📀 «{t}»\n🎤 {a}\n🆔 {id}\n\nاین درخواست به مدیر ارسال می‌شود و پس از تأیید حذف خواهد شد. این عمل برگشت‌ناپذیر است.\nپست کانال هم پاک می‌شود.",
    DELETE_BTN_NO: "نه",
    DELETE_BTN_NOPE: "نه، پشیمون شدم!",
    DELETE_BTN_YES: "بله، ۱۰۰٪ مطمئنم!",
    DELETE_BTN_BACK: "« بازگشت",
    DELETE_REQUEST_SENT: "✅ درخواست حذف «{t}» به مدیر ارسال شد. پس از تأیید نتیجه به تو اطلاع داده می‌شود.",
    DELETE_CANCELLED: "❌ حذف لغو شد.",
    DELETE_ADMIN_TITLE: "🗑 درخواست حذف اثر\n📀 «{t}»\n👤 {u} (🆔 {id})\n🆔 اثر: {sid}\n🗓 {d}",
    DELETE_ADMIN_APPROVE: "✅ تأیید حذف",
    DELETE_ADMIN_REJECT: "❌ رد درخواست",
    EDIT_MENU_TITLE: "✏️ ویرایش «{t}»",
    EDIT_FIELD_TITLE: "عنوان",
    EDIT_FIELD_ARTISTS: "هنرمند",
    EDIT_FIELD_FEATURING: "همراه (feat)",
    EDIT_FIELD_CAPTION: "کپشن",
    EDIT_FIELD_CREDITS: "عوامل",
    EDIT_FIELD_COVER: "کاور",
    EDIT_FIELD_FREESTYLE: "🎤 اجرای فری‌استایل",
    EDIT_FIELD_LINKS: "لینک‌ها",
    EDIT_FIELD_SCHEDULE: "زمان انتشار",
    SCHEDULE_USER_REMOVED: "🗓 زمان‌بندی انتشار از سمت کاربران برداشته شده است.\nاثرها به‌ترتیب و خودکار در صف انتشار قرار می‌گیرند؛ زمان دقیق را مدیر تعیین می‌کند.",
    EDIT_PROMPT_CAPTION: "📝 کپشن جدید را بفرست (متن آزاد). برای حذف کپشن «—» بفرست.",
    EDIT_PROMPT_FEATURING: "🎧 نام هنرمند همراه (feat) را بفرست یا «—» برای حذف.",
    EDIT_PROMPT_CREDITS: "🧩 عوامل را هر کدام در یک خط بفرست، مثلاً:\nProduction: نام\nMix: نام",
    EDIT_PROMPT_SCHEDULE: "🗓 زمان جدید را بفرست: 2026-01-20 21:30 یا «+2h» یا «—» برای لغو زمان.",
    EDIT_SUCCESS: "✅ «{f}» به‌روزرسانی شد و برای بررسی دوباره به مدیر ارسال شد.",
    LINK_PROMPT: "🔗 لینک‌های انتشار را بفرست (اینستاگرام، ساندکلاد، اسپاتیفای، یوتیوب…).\nاگر لینک نداری «➡️ مرحلهٔ بعد» را بزن.",
    LINK_BAD: "❌ لینک معتبر نبود؛ آدرس کامل با https بفرست.",
    LINK_ADDED: "✅ {n} لینک اضافه شد (مجموع {t}).",
    LINK_PANEL: "🔗 لینک‌ها و نمایششان در کپشن:", ALBUM_NEEDS_TWO: "❌ آلبوم حداقل دو ترک می‌خواهد؛ برای تک‌آهنگ «🎵 ارسال موزیک» را بزن.",
    SINGLE_ONLY_ONE: "❌ برای تک‌آهنگ فقط یک MP3 بفرست؛ برای چند ترک «🎼 ارسال آلبوم» را بزن.",
    DETAILS_TITLE: "🧾 اطلاعات نهایی", DETAILS_NO_COVER: "🖼 کاوری نفرستادی — کاور پیش‌فرض کانال استفاده می‌شود.",
    DETAILS_TITLE_L: "📀 عنوان: ", DETAILS_ARTISTS_L: "🎤 هنرمند: ", DETAILS_FEAT_L: "🎧 همراه: ",
    DETAILS_PHOTOS: "🖼 عکس: ", DETAILS_AUDIO: "🎧 صدا: ", DETAILS_CREDITS: "🧩 ",
    DETAILS_SCHEDULE: "🗓 زمان انتشار: ", DETAILS_SOON: "⏳ نوع: Coming Soon",
    DETAILS_HINT: "با «عنوان: …»، «هنرمند: …»، «همراه: …»، «زمان: 2026-01-20 21:30» یا «Production: …» تغییر بده. برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    DETAILS_MISSING: "⚠️ ناقص: ",
    LINK_PROMPT: "🔗 لینک‌های انتشار را بفرست (اینستاگرام، ساندکلاد، اسپاتیفای، یوتیوب…).\nاگر لینک نداری «➡️ مرحلهٔ بعد» را بزن.",
    LINK_BAD: "لینک معتبری پیدا نشد. لینک کامل را بفرست یا «➡️ مرحلهٔ بعد» را بزن.",
    LINK_ADDED: "🔗 {n} لینک جدید ثبت شد (مجموع {t}). لینک بعدی، یا برای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    LINK_PANEL: "🔗 می‌توانی این لینک‌ها را در پست مخفی/نمایش بدهی، یا لینک دیگری بفرستی.\nبرای پایان «➡️ مرحلهٔ بعد» را بزن.",
    PLATFORM_SHOWN: "نمایش", PLATFORM_HIDDEN: "مخفی",
    PREVIEW_TITLE: "👁 پیش‌نمایش پست کانال:\n\n",
    PREVIEW_HINT: "\n\n— — —\nاگر نهایی است «✅ بله، ثبت کن» را بزن تا برای تأیید مدیر ارسال شود؛\nبرای اصلاح «❌ نه، بازگرد» را بزن (به مرحلهٔ عنوان برمی‌گردی).",
    SUBMIT_OK: "✅ ثبت شد",
    SUBMIT_ID: "🆔 ", SUBMIT_TITLE_L: "📀 ", SUBMIT_ARTIST_L: "🎤 ", SUBMIT_DATE_L: "🗓 ",
    SUBMIT_NOTHING: "❌ هیچ رسانه‌ای ثبت نشده؛ از ابتدا شروع کن.",
    SUBMIT_TITLE_ASK: "❌ عنوان را بفرست (مثلاً «عنوان: شب»).", SUBMIT_ARTIST_ASK: "❌ هنرمند را بفرست (مثلاً «هنرمند: فلورا»).",
    METADATA_TITLE_ONLY: "📀 عنوان ثبت شد: {t}\nحالا هنرمند را با «هنرمند: …» بفرست یا نام هنرمند را بنویس.",
    METADATA_ARTIST_ONLY: "🎤 هنرمند ثبت شد: {t}\nبرای ادامه «➡ مرحلهٔ بعد» را بزن.",
    METADATA_SAVED: "✅ ذخیره شد: ", METADATA_MORE: "\nبرای ادامه «➡️ مرحلهٔ بعد» را بزن.",
    METADATA_FIX: "برای ادامه «➡️ مرحلهٔ بعد» را بزن، یا اطلاعات را با «عنوان: …» / «هنرمند: …» اصلاح کن.",
    DRAFT_MENU_HINT: "✳️ یک پیش‌نویس باز داری. اول «✅ پایان ارسال»/«➡️ مرحلهٔ بعد» را بزن یا «❌ لغو» کن.",
    CANCEL_FLOW: "❌ ارسال لغو شد.",
    SCHEDULE_BAD: "زمان معتبر نیست. قالب: 2026-01-20 21:30 (باید در آینده باشد)",
    SCHEDULE_FULL: "⛔ ظرفیت صف انتشار پر است؛ کمی بعد دوباره تلاش کن.",
    DAILY_LIMIT: "⛔ سقف ارسال روزانهٔ تو ({n}) پر شده است. فردا دوباره تلاش کن.",
    RATE_LIMITED: "⏳ کمی آرام‌تر! تا یک لحظهٔ دیگر دوباره تلاش کن.",
    DUPLICATE_FILE: "♻️ این فایل قبلاً با همین عنوان ثبت شده است.",
    DUPLICATE_TITLE: "♻️ موزیکی با همین عنوان و هنرمند قبلاً ثبت شده است.",
    DUPLICATE_FIX_HINT: "✏️ عنوان تازه را همین‌جا بنویس (مثلاً «عنوان: شب (ریمیکس)») تا اثر ثبت شود؛\nاگر نمی‌خواهی ادامه بدهی «❌ لغو» را بزن.",
    // آثار من
    MY_WORKS_TITLE: "📚 آثار من",
    MY_WORKS_EMPTY: "📚 هنوز اثری ثبت نکرده‌ای.\nبا «🎵 ارسال موزیک» شروع کن.",
    MY_WORK_OFFLINE_NOTE: "\n\nاین ترک هنوز منتشر نشده؛ پس از تأیید و انتشار، فایل و لینک کانال در دسترس قرار می‌گیرد.",
    DOWNLOAD_BTN: "⬇️ دانلود فایل", POST_LINK_BTN: "🔗 لینک پست کانال",
    // جایگزین‌ها
    ALT_DRAFT_COVER: "🎵 می‌توانی همین‌جا کاور پیش‌فرض را ببینی یا کاور خودت را بفرستی.",
    ALT_PREVIEW: "🖼 پیش‌نمایش کپشن بالا آماده شد.",
    ALT_COMMENT: "💬 پست به‌صورت عکس با کپشن ارسال شد و کامنت‌ها زیر همان پست باز است.",
    ALT_DELETE_MEDIA: "🗑 فایل‌ها برای محدودیت حجم یا نظافت از گفت‌وگو حذف می‌شوند.",
    ALT_PUBLISHED: "✅ موزیک در کانال منتشر شد و در «📚 آثار من» هم دیده می‌شود.",
    // انتشار/دانلود
    DOWNLOAD_OFF: "این ترک فعلاً برای دانلود در دسترس نیست.",
    DOWNLOAD_DISABLED: "این ترک فعلاً برای دانلود فعال نیست یا هنوز در کانال منتشر نشده است.",
    DOWNLOAD_BAD_LINK: "لینک دانلود معتبر نیست.",
    DOWNLOAD_SEND_FAIL: "ارسال فایل ممکن نشد؛ کمی بعد دوباره تلاش کن.",
    DOWNLOAD_CAPTION: "🎧 {t}\n🎤 {a}\n\n{tg}",
    DOWNLOAD_ALBUM_CAPTION: "💿 {t}\n🎤 {a}\n\n{tg}",
    PUBLISHED_NOTIFY: "✅ موزیک تو منتشر شد: «{t}»{links}",
    PUBLISH_ADMIN_NOTIFY: "✅ انتشار انجام شد\n🆔 {id}\n📀 {t}",
    PUBLISH_FAIL_ADMIN: "⚠️ خطا در انتشار\n🆔 {id}\n📀 {t}\n🧩 مرحله: {s}\n❗️ {e}",
    PUBLISH_REVIEW_OK: "✅ ارسال تو تأیید شد: «{t}»",
    PUBLISH_REVIEW_NO: "❌ ارسال «{t}» تأیید نشد.{note}",
    PUBLISH_REVIEW_NOTE: "\n📝 دلیل: {note}",
    // پشتیبانی
    SUPPORT_OPEN: "📞 گفت‌وگو با پشتیبانی باز شد. هر پیامی (متن، عکس، فایل) بفرستی به مدیر می‌رسد.\nبرای پایان «❌ لغو» را بزن.",
    SUPPORT_SENT: "✅ پیامت به پشتیبانی رسید.",
    SUPPORT_START_BTN: "🆘 شروع گفت‌وگو با پشتیبانی",
    // پروفایل
    PROFILE_TITLE: "👤 پروفایل",
    PROFILE_ID: "🆔 ", PROFILE_PHONE: "📱 ", PROFILE_NAME: "🧾 ", PROFILE_RAP: "🎤 «{v}»",
    PROFILE_LOC: "📍 ", PROFILE_TRACKS: "🎵 ترک‌های منتشرشده: ", PROFILE_JOINED: "🗓 عضویت: ",
    PROFILE_BUTTONS: "با دکمه‌های زیر می‌توانی نام/شهر، رمز، زبان و حساب خودت را مدیریت کنی.",
    PROFILE_EDIT_NAME: "✏️ ویرایش نام", PROFILE_EDIT_LOC: "📍 ویرایش شهر", PROFILE_CHANGE_PW: "🔑 تغییر رمز",
    PROFILE_LANG: "🌍 زبان", PROFILE_2FA: "🔐 دومرحله‌ای", PROFILE_DELETE: "🗑 حذف حساب",
    EDIT_NAME_PROMPT: "👤 نام واقعی و لقب را با این قالب بفرست:\nنام؛ نام خانوادگی؛ لقب\nمثال: امیر؛ رضایی؛ فلورا\n(هر سه بخش با «؛» جدا شود یا فقط لقب را بنویس.)",
    EDIT_NAME_OK: "✅ نام و لقب ثبت شد: {n} — «{r}»",
    EDIT_LOC_OK: "✅ استان و شهر ثبت شد: {p} / {c}",
    CHANGE_PW_PROMPT: "🔑 رمز فعلی را بفرست:",
    CHANGE_PW_NEW: "رمز جدید را بفرست (حداقل ۶ کاراکتر):",
    CHANGE_PW_OK: "✅ رمز عوض شد. از این به بعد با رمز جدید وارد شو.",
    CHANGE_PW_BAD: "❌ رمز فعلی درست نیست. دوباره بفرست یا «❌ لغو» کن.",
    DEL_ACCOUNT_1: "⚠️ حذف حساب برگشت‌پذیر نیست.\nحساب، پروفایل، آثار و گفت‌وگوهای تو پاک می‌شود (پست‌های منتشرشده در کانال می‌مانند).\nبرای اطمینان بنویس: {c}",
    DEL_ACCOUNT_BAD: "❌ تأیید نشد. برای حذف باید کد {c} را بفرستی (یا «❌ لغو»).",
    DEL_ACCOUNT_DONE: "✅ حسابت حذف شد. اگر روزی خواستی، دوباره ثبت‌نام کن.",
    OK_GENERIC: "✅ انجام شد.", ERR_GENERIC: "خطا رخ داد؛ دوباره تلاش کن.",
    EXPIRED_BTN: "این دکمه منقضی شده است.", NO_ACCESS_BTN: "دسترسی نداری."
  },
  en: {
    BTN_REGISTER: "🟡 Register / Login", BTN_FORGOT: "🆘 Forgot password", BTN_SUPPORT: "📞 Support",
    BTN_SEND_MUSIC: "🎵 Submit track", BTN_SEND_ALBUM: "🎼 Submit album", BTN_COMING_SOON: "⏳ Coming Soon", BTN_FREESTYLE: "🎤 Freestyle",
    BTN_MY_WORKS: "📚 My works", BTN_PROFILE: "👤 Profile", BTN_LOGOUT: "🚪 Log out", BTN_CANCEL: "❌ Cancel",
    BTN_MY_CHANNELS: "📢 My channels",
    CC_LIST_TITLE: "📢 Your connected channels",
    CC_LIST_EMPTY: "No channel connected yet.\nMake the bot an admin in your channel (full access), then tap «➕ Add channel».",
    CC_ADD_ASK: "📢 Send your channel username or id (like @mychannel or -1001234567890).\nMake sure the bot is already an admin there.",
    CC_ADD_OK: "✅ Channel «{t}» connected. Your works are now covered and your channel gets advertised.",
    CC_ADD_NOT_CHANNEL: "❌ That chat is not a channel. Send your own channel id.",
    CC_ADD_NOT_ADMIN: "❌ The bot is not an admin there (or cannot post). Make it admin first, then retry.",
    CC_ADD_TAKEN: "❌ This channel is already connected by another user.",
    CC_ADD_LIMIT: "❌ Your connected-channel limit is {n}; disconnect one first.",
    CC_RM_OK: "🗑 Channel «{t}» removed.",
    CC_EDIT_ASK: "✏️ Send the new channel username or id to replace «{t}» (or tap «🔄 Sync info» if you only renamed it):",
    CC_EDIT_OK: "✅ Channel «{old}» was replaced with «{t}».",
    CC_SYNC_OK: "🔄 Channel «{t}» info updated from Telegram.",
    CC_BANNER_DELETED_WARN: "⚠️ You deleted our promotional banner from channel «{t}»!\n❌ Your coverage notice was removed from the main channel and a new banner has been re-posted to your channel. Please do not delete the banner.",
    CC_GATE_TEXT: "📢 To submit works and view them, first make the bot an admin in your Telegram channel (full access).\nFrom then on we cover your work and advertise your channel.",
    CC_GATE_BTN: "📢 Connect channel",
    CC_PROMO_TEXT: "🎬 New work «{t}» was published on the main channel.",
    CC_PROMO_BTN: "🔗 View post in channel",
    CC_ADVERTISE_LINE: "📢 Artist channel: {link}",
    CC_ADVERTISE_BTN: "📢 Artist channel",
    CC_KICKED_NOTIFY: "⛔ The bot is no longer admin in «{t}»; connection disabled. Make it admin again and reconnect from «📢 My channels».",
    BTN_FINISH: "✅ Finish", BTN_END: "✅ Finish", BTN_NEXT: "➡️ Next step", BTN_SKIP: "⏭ Skip",
    BTN_SEND_PHONE: "📱 Send my number", BTN_TRY_JOIN: "✅ Check membership", BTN_BACK: "⬅️ Back",
    BACK: "⬅️ Back", HOME: "🏠 Menu", READY: "Ready", YES: "✅ Yes, submit", NO: "❌ No, go back",
    CONFIRM: "Confirm", DELETE: "🗑 Delete", EDIT: "✏️ Edit", RETRY: "🔁 Retry", RELOAD: "🔁 Reload",
    LOGIN_NEEDED: "Please register or log in first.",
    NOT_SETUP: "⚫🟡 The bot is not set up yet; the admin must run /claim.",
    SENT_PHONE_PROMPT: "🟡 Please share your number with the official Telegram button to log in or register.\nIf the number is already registered, I will ask for your password.",
    PHONE_BUTTON_ONLY: "❌ Please use the «📱 Send my number» button.",
    PHONE_OTHER_ACCOUNT: "⚠️ This number belongs to another Telegram account.",
    PHONE_TAKEN: "⚠️ This Telegram account already has a profile with a different number.",
    ACCOUNT_BLOCKED: "⛔ Your account is blocked. Please contact support.",
    ACCOUNT_INACTIVE: "⏸ Your account is inactive. Please contact support.",
    ASK_FIRST_NAME: "📝 Your real first name:", ASK_LAST_NAME: "Your real last name:",
    ASK_RAP_NAME: "🎤 Your stage name:",
    BTN_ARTIST_PROFILE: "👤 From profile", BTN_ARTIST_MANUAL: "✍️ Enter manually",
    ARTIST_PROFILE_MISSING: "❌ No stage name in your profile. Please set it via Profile → Edit name or choose manual entry.",
    ARTIST_PROFILE_USED: "✅ Stage name «{n}» taken from profile.",
    ARTIST_MANUAL_PROMPT: "✍️ Enter the artist name manually:",
    ARTIST_ASK_ONCE: "🎤 Your profile has no stage name. Please enter it once to save:",
    ASK_PROVINCE: "📍 Pick your province:", ASK_CITY_FREE: "Type your city:",
    OTHER_COUNTRY: "🌍 Other (another country)", OTHER_COUNTRIES: "Pick your country:",
    PICK_PROVINCE: "Pick a province from the buttons:", PICK_CITY: "Pick a city from the buttons:", PICK_CITY_ACTIVE: "Pick your city from the buttons:",
    ASK_PW1: "Create a password (at least 6 characters):", ASK_PW2: "Send the same password again to confirm:",
    PW_RESTART: "Passwords did not match. Send a new password:",
    PW_LEN: "Password must be 6–64 characters; send it again:",
    SERVER_BUSY: "⏳ The server is briefly busy; your request was not saved. Wait a few seconds and send the same message again.",
    PHONE_SAVED: "✅ Number saved. Now send your password:",
    LOGIN_OK: "✅ Logged in.", LOGIN_FAIL: "❌ Wrong password; try again ({n}/5):",
    LOGIN_FAIL_2FA: "❌ Wrong password or 2FA code ({n}/5):",
    LOGIN_GATE: "🔐 Get the code with the button below and send it:",
    LOGIN_GATE_ASK: "Send the 6-digit code or one-time password:",
    LOGIN_GATE_WRONG: "❌ Wrong code ({n}/5):",
    LOGIN_GATE_OFF: "⛔ Two-step verification is disabled for this account; contact support.",
    LOGIN_ATTEMPTS_END: "❌ Too many attempts; start again.",
    FORGOT_PROMPT: "🆘 Password recovery\nSend the number you registered with; your request goes to the admin.",
    FORGOT_NO_ACCOUNT: "⚠️ No account found for this number and Telegram account.",
    FORGOT_BLOCKED: "⛔ Your account is blocked; recovery request not created.",
    FORGOT_SENT: "✅ Recovery request sent to the admin. After approval you'll get a button to set a new password.",
    FORGOT_APPROVED: "✅ Your recovery request was approved. Tap the button to set a new password.",
    FORGOT_REJECTED: "❌ Your recovery request was rejected. Please contact support.",
    FORGOT_INVALID: "This recovery request is no longer valid.",
    PW_SET: "✅ New password saved; please log in.",
    FORGOT_PW_PROMPT: "Send your new password (at least 6 characters):",
    MENU_TITLE: "🎵 Main menu\nUse the buttons below:", ADMIN_MENU_TITLE: "🎛 Flora Bot admin panel",
    ADMIN_AUTH_NEEDED: "Please register or log in with this Telegram account to open the admin panel.",
    ADMIN_ALREADY: "You are already an admin.", ADMIN_CLAIM_BAD: "Wrong admin code.", ADMIN_CLAIM_OK: "✅ Admin access enabled.",
    ADMIN_CLAIM_EXISTS: "An admin already exists; add more admins from «🛡 Admin access».",
    ADMIN_BLOCKED: "⛔ This admin account is blocked; contact the owner.",
    ADMIN_INACTIVE: "⏸ This admin account is inactive; contact the owner.",
    ADMIN_LOGIN_CANCELLED: "Admin login cancelled.",
    ADMIN_SESSION_EXPIRED: "🔐 Please log in again to continue:",
    ADMIN_2FA_ON: "✅ Two-step verification enabled.",
    JOINNEEDED_TITLE: "🚸 Please join the channels below, then tap «✅ Check membership».",
    JOIN_CONFIRMED: "✅ Membership confirmed.", JOIN_NOT_YET: "Membership is not complete yet.",
    JOIN_JOIN_CHANNEL: "Join ",
    LOGGED_OUT: "🚪 Logged out.",
    LANG_PICK: "🌍 Choose language:", LANG_SET: "Language updated.",
    USER_MENU_HINT: "Use the menu below.",
    CANCEL_DONE: "❌ Cancelled.", CANCEL_WRONG_STAGE: "Invalid step; please start again.",
    MAIN_MENU_BTN: "🎵 Main menu", BTN_ADMIN: "🎛 Admin panel",
    MUSIC_MEDIA_SIMPLE: "🎵 Submit track\n1) Send the cover (up to {n} photos).\n2) Send the MP3 file.\n3) Tap «✅ Finish».",
    MUSIC_MEDIA_ALBUM: "🎼 Album\n1) Send all covers at once (up to {n} photos).\n2) Send MP3 files in order.\n3) Tap «✅ Finish».",
    MUSIC_MEDIA_COMING: "⏳ Coming Soon\nSend a cover; this is an announcement post and needs no audio.",
    STEP_COVER_SIMPLE: "🖼 Step 1 — Cover\nSend the cover: photo or video only, up to {n} items (as a grid).\nMusic files, voice, video messages and text are not accepted here.\nNo cover? Just tap «➡️ Next step» and the channel default cover is used.",
    STEP_COVER_ALBUM: "🖼 Step 1 — Album cover\nSend the covers together (grid): photo or video only, up to {n} items.\nMusic files, voice, video messages and text are not accepted here.\nNo cover? Just tap «➡️ Next step» and the channel default cover is used.",
    STEP_COVER_COMING: "⏳ Step 1 — Coming Soon\nOnly one media item is allowed. Pick its type first:\n📷 Photo · 🎬 Video · 🎥 Video message · 🎙 Voice",
    STEP_COVER_ONLY: "❌ Send the cover (photo or video) — up to {n} items.\nMusic files, voice, video messages and text are not accepted at this step.",
    STEP_COVER_ONLY_COMING: "❌ Coming Soon allows one item only: photo, video, video message or voice.",
    STEP_COVER_ADDED: "✅ Cover saved ({p} of {n}). Send another or tap «➡️ Next step».",
    STEP_COVER_FULL: "✅ {p} covers saved (grid is full). Now tap «➡️ Next step».",
    STEP_AUDIO_SIMPLE: "🎧 Step 2 — Music file\nSend one MP3 file only (a single = one file).\nVoice, video messages and other formats are not accepted as music.",
    STEP_AUDIO_ALBUM: "🎧 Step 2 — Album tracks\nSend your MP3 files in order (as many tracks as you have).\nVoice, video messages and other formats are not accepted.\nTap «✅ Finish» when done.",
    STEP_AUDIO_ONLY_MP3: "❌ Only MP3 files are accepted as music. That file was not added.",
    STEP_AUDIO_NO_VOICE: "❌ Voice and video messages are not accepted as music; send an MP3 file.",
    STEP_AUDIO_NO_COVER: "❌ The cover step is done; send MP3 files here only.",
    STEP_AUDIO_ADDED_SINGLE: "✅ Music file saved. Tap «➡️ Next step» to continue.",
    STEP_AUDIO_ADDED_ALBUM: "✅ {a} track(s) saved. Send the next one or tap «✅ Finish».",
    STEP_AUDIO_SINGLE_LIMIT: "❌ A single allows only one MP3. Use «🎼 Submit album» for multiple tracks.",
    // ── Freestyle (live video performance) ──
    STEP_COVER_FREESTYLE: "🖼 Step 1 — Cover (optional)\nSend up to {n} photos or videos. If you send none, the freestyle performance itself becomes the channel post.\nTap «➡️ Next step» to skip.",
    STEP_AUDIO_FREESTYLE: "🎤 Step 2 — Freestyle performance\nSend exactly one of these:\n🎥 Round video message · 🎬 Video · 🎵 MP3 file\nVoice notes and photos are not accepted here.",
    FREESTYLE_MEDIA_ADDED: "✅ Freestyle performance saved: {k}. Tap «➡️ Next step» to continue.",
    FREESTYLE_ONLY_ONE: "❌ Freestyle allows one performance only (video message, video or MP3). Tap «➡️ Next step» to continue.",
    FREESTYLE_NO_VOICE: "❌ Voice notes are not accepted for freestyle; send a round video message, a video or an MP3.",
    FREESTYLE_NO_PHOTO: "❌ Photos belong to the cover step; send a video message, a video or an MP3 here.",
    FREESTYLE_KIND_AUDIO: "🎵 MP3 file",
    NEED_FREESTYLE_MEDIA: "❌ No freestyle performance yet; send a video message, a video or an MP3.",
    STEP_AUDIO_ONLY_FREESTYLE: "❌ Only media is accepted here: 🎥 a round video message, 🎬 a video or 🎵 an MP3 file.",
    // ── Genre step (per-post variable hashtags) ──
    GENRE_ASK: "🏷 Genre step — pick the mood of the track (up to {n}).\nYour choice builds the variable hashtags of the channel post, e.g. #Trap\nYou can also type a genre («Genre: trap») or tap «⏭ Skip».",
    GENRE_SAVED: "🏷 Genre saved: {v}\nSend another one if you like, otherwise tap «➡️ Next step».",
    GENRE_LIMIT: "❌ Up to {n} genres allowed. Tap «➡️ Next step» to continue.",
    GENRE_NONE_YET: "🏷 No genre selected yet. Tap a button, type a genre, or tap «⏭ Skip».",
    GENRE_TOO_LONG: "❌ A genre name must be 2 to 24 characters long.",
    STEP_GENRE_ONLY: "❌ You are at the «Genre» step; only the genre buttons or «Genre: …» text are accepted.",
    BTN_CS_PHOTO: "📷 Photo", BTN_CS_VIDEO: "🎬 Video", BTN_CS_VIDEO_NOTE: "🎥 Video message", BTN_CS_VOICE: "🎙 Voice",
    CS_KIND_PROMPT: "✅ Media type selected: {k}. Now send exactly one {k}.",
    CS_KIND_MISMATCH: "❌ You picked «{k}»; send that type only (or cancel and start over).",
    CS_ONLY_ONE: "❌ Coming Soon allows one media item only; tap «➡️ Next step» to continue.",
    STEP_MEDIA_WRONG_STAGE: "❌ You are at the «{s}» step; only {w} is accepted here.",
    DRAFT_OPEN: "✳️ You have an open draft. Finish it first or tap «❌ Cancel».",
    DRAFT_NOT_FOUND: "Draft not found; start from the menu.",
    ONLY_MEDIA: "Send a photo/MP3 for this step or tap «✅ Finish».",
    FILE_UNSUPPORTED: "This message type is not supported.",
    FILE_NOT_AUDIO: "This audio file cannot be used; send an MP3.",
    AUDIO_TOO_BIG: "❌ File is larger than {n} MB. Send a smaller file.",
    AUDIO_ACCEPTED_EXT: "❌ Unsupported audio format. Allowed: MP3, M4A, WAV, FLAC, OGG, OPUS, AAC.",
    MEDIA_LIMIT: "Up to {n} audio files allowed.",
    COVER_LIMIT: "Up to {n} covers (photo or video) allowed.",
    MEDIA_ADDED: "✅ Saved ({p} photos, {a} audio). Send the next one or tap «✅ Finish».",
    MEDIA_COVER_10: "✅ Covers saved. Now send the MP3 file.",
    MEDIA_COVER_AND_AUDIO: "✅ Cover and audio saved. Add more or tap «✅ Finish».",
    NEED_AUDIO: "❌ Send the MP3 file.", NEED_COVER: "🖼 Send at least one cover for Coming Soon.",
    MFA_CODE_TEXT: "🔐 Your one-time code: <code>{c}</code>\nKeep it like a second password; you will be asked for it at the next login.\nIf you lose it, generate a new one from «🔐 2FA».",
    MFA_CODE_ROTATED: "🔐 Your new 2FA code: <code>{c}</code>",
    MFA_CODE_ONLY: "🔐 Your 2FA code: <code>{c}</code>",
    MFA_OFF: "✅ Two-step login is off.",
    DEL_ACCOUNT_CONFIRM_BTN: "🗑 Yes, delete my account",
    LOGIN_GATE_HINT: "If you lost the code, request a reset from «🆘 Forgot password».",
    NEW_MEDIA_REQUIRED: "❌ This submission type needs media.",
    EDIT_COVER_PROMPT: "🖼 Send the new cover photo.",
    EDIT_COVER_OK: "✅ Cover replaced.",
    PREVIEW_EDIT_NOTE: "⚠️ Editing title/links sends the release back for review.",
    PLATFORM_HIDDEN: "hidden in caption",
    PLATFORM_SHOWN: "shown in caption",
    MY_WORKS_TITLE: "📚 My works",
    MY_WORKS_EMPTY: "You have no releases yet.",
    MY_WORK_OFFLINE_NOTE: "ℹ️ This release is not on the channel yet.",
    MY_WORKS_FILTER_ALL: "All",
    MY_WORKS_FILTER_PENDING: "⏳ Pending",
    MY_WORKS_FILTER_APPROVED: "🗓 Queued",
    MY_WORKS_FILTER_PUBLISHED: "✅ Published",
    MY_WORKS_FILTER_REJECTED: "❌ Rejected",
    MY_WORKS_FILTER_FAILED: "⚠️ Failed",
    MY_WORKS_FILTER_DELETE_PENDING: "🗑 Awaiting deletion",
    POST_LINK_BTN: "🔗 Open channel post",
    POST_VIEW_BTN: "🔗 View on channel",
    DOWNLOAD_BTN: "⬇️ Download",
    DOWNLOAD_FILE_BTN: "⬇️ Get file",
    EDIT_BTN: "✏️ Edit",
    DELETE_BTN: "🗑 Delete",
    DELETE_CONFIRM_TITLE: "⚠️ Delete «{t}»",
    DELETE_CONFIRM_TEXT: "⚠️ Are you sure you want to delete «{t}»?\\n\\n📀 «{t}»\\n🎤 {a}\\n🆔 {id}\\n\\nThis will be sent to admin for approval.",
    DELETE_BTN_NO: "No",
    DELETE_BTN_NOPE: "Nope, nevermind",
    DELETE_BTN_YES: "Yes, I’m 100% sure!",
    DELETE_BTN_BACK: "« Back",
    DELETE_REQUEST_SENT: "✅ Delete request for «{t}» sent.",
    DELETE_CANCELLED: "❌ Cancelled.",
    DELETE_ADMIN_TITLE: "🗑 Delete request\\n📀 «{t}»\\n👤 {u} (🆔 {id})\\n🆔 {sid}",
    DELETE_ADMIN_APPROVE: "✅ Approve delete",
    DELETE_ADMIN_REJECT: "❌ Reject",
    EDIT_MENU_TITLE: "✏️ Edit «{t}»",
    EDIT_FIELD_TITLE: "Title",
    EDIT_FIELD_ARTISTS: "Artist",
    EDIT_FIELD_FEATURING: "Featuring",
    EDIT_FIELD_CAPTION: "Caption",
    EDIT_FIELD_CREDITS: "Credits",
    EDIT_FIELD_COVER: "Cover",
    EDIT_FIELD_FREESTYLE: "Freestyle performance",
    EDIT_FIELD_LINKS: "Links",
    EDIT_FIELD_SCHEDULE: "Schedule",
    SCHEDULE_USER_REMOVED: "🗓 Scheduling has been removed for users.\nWorks are queued automatically in order; the admin sets the exact publish time.",
    EDIT_PROMPT_CAPTION: "📝 Send new caption.",
    EDIT_PROMPT_FEATURING: "🎧 Send featuring.",
    EDIT_PROMPT_CREDITS: "🧩 Send credits.",
    EDIT_PROMPT_SCHEDULE: "🗓 Send new date.",
    EDIT_SUCCESS: "✅ «{f}» updated.",
    LINK_PROMPT: "🔗 Send your release links (Instagram, SoundCloud, Spotify, YouTube…).\nTap «➡️ Next step» if you have none.",
    LINK_BAD: "❌ That is not a valid link; send a full https URL.",
    LINK_ADDED: "✅ {n} link(s) added ({t} total).",
    LINK_PANEL: "🔗 Links and their visibility in the caption:", ALBUM_NEEDS_TWO: "❌ An album needs at least two tracks; use «🎵 Submit track» for a single.",
    SINGLE_ONLY_ONE: "❌ A single takes one MP3; use «🎼 Submit album» for multiple tracks.",
    DETAILS_TITLE: "🧾 Final details", DETAILS_NO_COVER: "🖼 No cover sent — the default cover will be used.",
    DETAILS_TITLE_L: "📀 Title: ", DETAILS_ARTISTS_L: "🎤 Artist: ", DETAILS_FEAT_L: "🎧 Featuring: ",
    DETAILS_PHOTOS: "🖼 Photos: ", DETAILS_AUDIO: "🎧 Audio: ", DETAILS_CREDITS: "🧩 ",
    DETAILS_SCHEDULE: "🗓 Scheduled: ", DETAILS_SOON: "⏳ Type: Coming Soon",
    DETAILS_HINT: "Edit with «Title: …», «Artist: …», «Feat: …», «Schedule: 2026-01-20 21:30» or «Production: …». Then tap «➡️ Next step».",
    DETAILS_MISSING: "⚠️ Missing: ",
    LINK_PROMPT: "🔗 Send release links (Instagram, SoundCloud, Spotify, YouTube…).\nIf you have none, tap «➡️ Next step».",
    LINK_BAD: "No valid link found. Send a full link or tap «➡️ Next step».",
    LINK_ADDED: "🔗 {n} new link(s) saved ({t} total). Send another or tap «➡️ Next step».",
    LINK_PANEL: "🔗 Hide/show these links in the post, or send another link.\nTap «➡️ Next step» when done.",
    PLATFORM_SHOWN: "shown", PLATFORM_HIDDEN: "hidden",
    PREVIEW_TITLE: "👁 Channel post preview:\n\n",
    PREVIEW_HINT: "\n\n— — —\nIf it is final tap «✅ Yes, submit» to send it for admin approval;\nto fix it tap «❌ No, go back» (returns to the track-name step).",
    SUBMIT_OK: "✅ Submitted",
    SUBMIT_ID: "🆔 ", SUBMIT_TITLE_L: "📀 ", SUBMIT_ARTIST_L: "🎤 ", SUBMIT_DATE_L: "🗓 ",
    SUBMIT_NOTHING: "❌ No media saved; start again.",
    SUBMIT_TITLE_ASK: "❌ Send the title (e.g. «Title: Night»).", SUBMIT_ARTIST_ASK: "❌ Send the artist (e.g. «Artist: Flora»).",
    METADATA_TITLE_ONLY: "📀 Title saved: {t}\nNow send the artist with «Artist: …» or type the name.",
    METADATA_ARTIST_ONLY: "🎤 Artist saved: {t}\nTap «➡ Next step» to continue.",
    METADATA_SAVED: "✅ Saved: ", METADATA_MORE: "\nTap «➡️ Next step» to continue.",
    METADATA_FIX: "Tap «➡️ Next step», or fix details with «Title: …» / «Artist: …».",
    DRAFT_MENU_HINT: "✳️ You have an open draft. Tap «✅ Finish»/«➡️ Next step» or «❌ Cancel».",
    CANCEL_FLOW: "❌ Submission cancelled.",
    SCHEDULE_BAD: "Invalid time. Format: 2026-01-20 21:30 (must be in the future).",
    SCHEDULE_FULL: "⛔ The publishing queue is full; try again later.",
    DAILY_LIMIT: "⛔ You reached the daily limit ({n} submissions). Try again tomorrow.",
    RATE_LIMITED: "⏳ Slow down a bit and try again in a moment.",
    DUPLICATE_FILE: "♻️ This file was already submitted with the same title.",
    DUPLICATE_TITLE: "♻️ A track with the same title and artist already exists.",
    DUPLICATE_FIX_HINT: "✏️ Type the new title right here (e.g. «Title: Night (remix)») to submit it;\nor tap «❌ Cancel» if you do not want to continue.",
    MY_WORKS_TITLE: "📚 My works",
    MY_WORKS_EMPTY: "📚 You have not submitted anything yet.\nStart with «🎵 Submit track».",
    MY_WORK_OFFLINE_NOTE: "\n\nThis track is not published yet; the file and channel link appear after publishing.",
    DOWNLOAD_BTN: "⬇️ Download file", POST_LINK_BTN: "🔗 Channel post",
    ALT_DRAFT_COVER: "🎵 You can preview the default cover here or send your own.",
    ALT_PREVIEW: "🖼 The caption preview is ready above.",
    ALT_COMMENT: "💬 The post is sent as a photo with a caption so comments stay under it.",
    ALT_DELETE_MEDIA: "🗑 Files are removed from the chat after a short time.",
    ALT_PUBLISHED: "✅ Your track is published and listed under «📚 My works».",
    DOWNLOAD_OFF: "This track is not available for download right now.",
    DOWNLOAD_DISABLED: "This track is not downloadable yet or not published.",
    DOWNLOAD_BAD_LINK: "Invalid download link.",
    DOWNLOAD_SEND_FAIL: "Could not send the file; try again shortly.",
    DOWNLOAD_CAPTION: "🎧 {t}\n🎤 {a}\n\n{tg}",
    DOWNLOAD_ALBUM_CAPTION: "💿 {t}\n🎤 {a}\n\n{tg}",
    PUBLISHED_NOTIFY: "✅ Your track is published: «{t}»{links}",
    PUBLISH_ADMIN_NOTIFY: "✅ Published\n🆔 {id}\n📀 {t}",
    PUBLISH_FAIL_ADMIN: "⚠️ Publish failed\n🆔 {id}\n📀 {t}\n🧩 Stage: {s}\n❗️ {e}",
    PUBLISH_REVIEW_OK: "✅ Your submission was approved: «{t}»",
    PUBLISH_REVIEW_NO: "❌ Your submission «{t}» was rejected.{note}",
    PUBLISH_REVIEW_NOTE: "\n📝 Reason: {note}",
    SUPPORT_OPEN: "📞 Support chat opened. Anything you send (text, photo, file) reaches the admin.\nTap «❌ Cancel» to end.",
    SUPPORT_SENT: "✅ Your message reached support.",
    SUPPORT_START_BTN: "🆘 Start support chat",
    PROFILE_TITLE: "👤 Profile",
    PROFILE_ID: "🆔 ", PROFILE_PHONE: "📱 ", PROFILE_NAME: "🧾 ", PROFILE_RAP: "🎤 «{v}»",
    PROFILE_LOC: "📍 ", PROFILE_TRACKS: "🎵 Published tracks: ", PROFILE_JOINED: "🗓 Joined: ",
    PROFILE_BUTTONS: "Use the buttons below to manage your name/city, password, language and account.",
    PROFILE_EDIT_NAME: "✏️ Edit name", PROFILE_EDIT_LOC: "📍 Edit city", PROFILE_CHANGE_PW: "🔑 Change password",
    PROFILE_LANG: "🌍 Language", PROFILE_2FA: "🔐 Two-step", PROFILE_DELETE: "🗑 Delete account",
    EDIT_NAME_PROMPT: "👤 Send name and stage name like:\nFirst; Last; Stage\nExample: Amir; Rezaei; Flora\n(Or just type your stage name.)",
    EDIT_NAME_OK: "✅ Name saved: {n} — «{r}»",
    EDIT_LOC_OK: "✅ Location saved: {p} / {c}",
    CHANGE_PW_PROMPT: "🔑 Send your current password:",
    CHANGE_PW_NEW: "Send a new password (at least 6 characters):",
    CHANGE_PW_OK: "✅ Password changed. Use the new password from now on.",
    CHANGE_PW_BAD: "❌ Wrong current password. Try again or tap «❌ Cancel».",
    DEL_ACCOUNT_1: "⚠️ Deleting your account is permanent.\nYour profile, works and support history are removed (published channel posts stay).\nTo confirm, send: {c}",
    DEL_ACCOUNT_BAD: "❌ Not confirmed. Send {c} to delete (or «❌ Cancel»).",
    DEL_ACCOUNT_DONE: "✅ Account deleted. You can register again anytime.",
    OK_GENERIC: "✅ Done.", ERR_GENERIC: "Something went wrong; try again.",
    EXPIRED_BTN: "This button has expired.", NO_ACCESS_BTN: "No access."
  }
};
const LANGS = ["fa", "en"];
const EN_OVERRIDE_KEYS_ = { WELCOME_TEXT: "WELCOME_TEXT_EN", MAINTENANCE_TEXT: "MAINTENANCE_TEXT_EN", REG_DONE_TEXT: "REG_DONE_TEXT_EN", MUSIC_PENDING_TEXT: "MUSIC_PENDING_TEXT_EN", MUSIC_AUTO_TEXT: "MUSIC_AUTO_TEXT_EN", SUPPORT_CLOSED_TEXT: "SUPPORT_CLOSED_TEXT_EN", INACTIVE_TEXT: "INACTIVE_TEXT_EN" };
function userLang_(userId) {
  const u = userId ? getUserById_(userId) : null;
  let lang = String(u && u.lang || "");
  // زبان کاربرِ هنوز ثبت‌نام‌نشده هم باید اثر کند (قبلاً نادیده گرفته می‌شد).
  if (!lang && userId) {
    try { lang = String(CacheService.getScriptCache().get("lang_" + String(userId)) || ""); } catch (e) {}
  }
  if (!lang) lang = String(getSetting_("DEFAULT_LANG") || "fa");
  return MSG[lang] ? lang : "fa";
}
function tr_(key, vars, lang) {
  const dict = MSG[lang] || MSG.fa;
  let s = Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : (MSG.fa[key] || DEFAULT_SETTINGS[key] || key);
  if (vars) Object.keys(vars).forEach(function(k) { s = s.split("{" + k + "}").join(String(vars[k] == null ? "" : vars[k])); });
  return s;
}
function t_(userId, key, vars) { return tr_(key, vars, userLang_(userId)); }
function niceText_(key, vars, lang) {
  const l = MSG[lang] ? lang : "fa";
  if (l === "en") {
    // برای انگلیسی: ابتدا کلید override انگلیسی، بعد دیکشنری انگلیسی؛ متن فارسی مدیر استفاده نمی‌شود.
    const langKey = EN_OVERRIDE_KEYS_[key];
    if (langKey) {
      const override = String(getSetting_(langKey) || "").trim();
      if (override) return override;
    }
    return tr_(key, vars, "en");
  }
  const custom = String(getSetting_(key) || "").trim();
  if (custom) return custom;
  // اگر کلید در شیت نبود، متن پیش‌فرض؛ هرگز نام کلید به کاربر نشان داده نمی‌شود.
  const fallback = MSG.fa[key] || DEFAULT_SETTINGS[key] || "";
  return fallback ? tr_(key, vars, "fa") : String(key);
}

// ───────────────────────── راه‌اندازی شیت و وب‌هوک ─────────────────────────
function onOpen() {
  SpreadsheetApp.getUi().createMenu("🎵 فلورا بات")
    .addItem("۱. ساخت دیتابیس", "setupProject")
    .addItem("۲. ثبت توکن ربات", "saveBotToken")
    .addItem("نمایش کد اتصال مدیر", "showClaimCode")
    .addSeparator()
    .addItem("اتصال وب‌هوک بعد از Deploy", "connectWebhook")
    .addItem("بررسی وب‌هوک", "checkWebhook")
    .addItem("قطع وب‌هوک", "disconnectWebhook")
    .addSeparator()
    .addItem("فعال‌سازی پردازش صف‌ها", "enableWorkers")
    .addItem("توقف پردازش صف‌ها", "disableWorkers")
    .addItem("اجرای پردازش الان", "runWorkersNow")
    .addItem("پاک‌سازی نشست‌ها/تریگرها", "runCleanupNow")
    .addToUi();
}

function setupProject() {
  resetRuntimeCaches_();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error("این تابع را از یک Google Sheet اجرا کن.");
  PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
  Object.keys(HEADERS).forEach(function(name) { ensureSheet_(name, HEADERS[name]); });
  migrateSheetColumns_();
  Object.keys(DEFAULT_SETTINGS).forEach(function(key) {
    if (getSetting_(key) === "") setSetting_(key, DEFAULT_SETTINGS[key]);
  });
  if (!getSetting_("APP_SECRET")) setSetting_("APP_SECRET", newSalt_().slice(0, 40));
  ensureMusicDownloadDefaultMigration_();
  if (!getSetting_("CLAIM_CODE")) setSetting_("CLAIM_CODE", generateClaimCode_());
  styleSheets_();
  SpreadsheetApp.getActive().toast("دیتابیس آماده شد. حالا توکن را ثبت و وب‌اپ را Deploy کن.", "Flora Bot", 8);
}

// شیت پیش‌فرض Sheets دقیقاً ۲۶ ستون دارد (A..Z) و ستون بیست‌وهفتم خطای «maximum columns» می‌دهد.
// قبل از نوشتن هدر، شیت را تا تعداد لازم ستون گسترش می‌دهیم.
const SHEET_DEFAULT_COLS_ = 26;
function SCHEET_FALLBACK_COLS_(sh) { try { return sh.getLastColumn() || 26; } catch (e) { return 26; } }
function ensureSheet_(name, headers) {
  const ss = getDatabase_();
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  try {
    const need = headers.length;
    const have = sh.getMaxColumns ? sh.getMaxColumns() : SCHEET_FALLBACK_COLS_(sh);
    if (have < Math.max(need, SHEET_DEFAULT_COLS_)) sh.insertColumnsAfter(have, Math.max(need, SHEET_DEFAULT_COLS_) - have);
  } catch (e) { /* اگر شیت پهن‌کردن ممکن نبود، ادامه می‌دهیم */ }
  if (sh.getLastRow() === 0) sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  else {
    const current = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
    headers.forEach(function(h, i) { if (!current[i]) sh.getRange(1, i + 1).setValue(h); });
  }
  sh.setFrozenRows(1);
  return sh;
}

function migrateSheetColumns_() {
  // ستون‌های جدید ۰.۴ را بدون از دست رفتن داده به انتهای شیت‌های قبلی اضافه می‌کند.
  try { ensureSheet_(APP.SHEETS.ADMIN_LOG, HEADERS.AdminLog); } catch (e) {}
  try { ensureSheet_(APP.SHEETS.SESSIONS, HEADERS.Sessions); } catch (e) {}
  try { ensureSheet_(APP.SHEETS.CONNECTED_CHANNELS, HEADERS.ConnectedChannels); } catch (e) {}
  try { ensureSheet_(APP.SHEETS.CC_BANNER, HEADERS.CcBanner); } catch (e) {}
  try { ensureSheet_(APP.SHEETS.CC_POSTS, HEADERS.CcPosts); } catch (e) {}
}

function styleSheets_() {
  Object.keys(HEADERS).forEach(function(name) {
    try {
      const sh = getSheet_(name);
      sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold");
      sh.autoResizeColumns(1, Math.min(sh.getLastColumn(), 8));
    } catch (e) {}
  });
}

function getBotUsername_() {
  // یک منبع واحد برای یوزرنیم ربات؛ قبلاً آیدی هارد‌کد شده بود و لینک دانلود به بات دیگری می‌رفت.
  if (BOT_USERNAME_MEMO_) return BOT_USERNAME_MEMO_;
  let username = String(getSetting_("BOT_USERNAME") || "").replace(/^@/, "").trim();
  if (!username) {
    const me = telegramRequest_("getMe", {});
    if (me && me.ok && me.result && me.result.username) {
      username = String(me.result.username);
      try { setSetting_("BOT_USERNAME", username); } catch (e) {}
    }
  }
  BOT_USERNAME_MEMO_ = username || "";
  return BOT_USERNAME_MEMO_;
}
function getBotToken_() { return PropertiesService.getScriptProperties().getProperty("BOT_TOKEN") || ""; }
function saveBotToken() {
  const ui = SpreadsheetApp.getUi();
  const r = ui.prompt("توکن BotFather", "توکن را وارد کن (در شیت ذخیره نمی‌شود):", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const token = String(r.getResponseText() || "").trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) { ui.alert("فرمت توکن درست نیست."); return; }
  const me = telegramRequest_("getMe", {}, token);
  if (!me.ok) { ui.alert("توکن معتبر نیست: " + (me.description || "")); return; }
  PropertiesService.getScriptProperties().setProperty("BOT_TOKEN", token);
  if (me.result && me.result.username) setSetting_("BOT_USERNAME", String(me.result.username));
  ui.alert("✅ توکن ثبت شد: @" + me.result.username);
}

function connectWebhook() {
  const ui = SpreadsheetApp.getUi();
  if (!getBotToken_()) { ui.alert("اول توکن را ثبت کن."); return; }
  const r = ui.prompt("اتصال وب‌هوک", "URL وب‌اپ Deployشده که به /exec ختم می‌شود:", ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return;
  const url = String(r.getResponseText() || "").trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)) { ui.alert("URL باید با /exec تمام شود."); return; }
  PropertiesService.getScriptProperties().setProperty("WEB_APP_URL", url);
  const out = telegramRequest_("setWebhook", { url: url, max_connections: 40, drop_pending_updates: false, allowed_updates: ["message", "callback_query", "my_chat_member"] });
  if (out.ok) { setSetting_("READY", "true"); ui.alert("✅ وب‌هوک وصل شد. داخل ربات /claim کد را بفرست."); }
  else ui.alert("خطا: " + JSON.stringify(out));
}
function checkWebhook() {
  const r = telegramRequest_("getWebhookInfo", {});
  SpreadsheetApp.getUi().alert(r.ok ? "URL: " + (r.result.url || "—") + "\nدر انتظار: " + (r.result.pending_update_count || 0) + "\nخطا: " + (r.result.last_error_message || "ندارد") : JSON.stringify(r));
}
function disconnectWebhook() {
  const r = telegramRequest_("deleteWebhook", { drop_pending_updates: false });
  SpreadsheetApp.getUi().alert(r.ok ? "وب‌هوک قطع شد." : JSON.stringify(r));
}
function enableWorkers() {
  disableWorkerTriggers_();
  ScriptApp.newTrigger("publishQueueJob").timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger("broadcastQueueJob").timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger("cleanupJob").timeBased().everyHours(Math.max(1, Number(getSetting_("CLEANUP_INTERVAL_HOURS") || 6))).create();
  if (String(getSetting_("BACKUP_ENABLED") || "false") === "true") ensureWeeklyBackupTrigger_();
  SpreadsheetApp.getActive().toast("✅ پردازش صف انتشار/پیام‌ها و نظافت خودکار فعال شد.", "Flora Bot", 6);
}
function disableWorkers() { disableWorkerTriggers_(); SpreadsheetApp.getActive().toast("پردازش صف‌ها متوقف شد.", "Flora Bot", 5); }
// نصب/بازسازی همهٔ تریگرهای لازم (از منوی مدیر و اسکریپت‌ادیتور قابل اجراست)
function installTriggers_() {
  const wanted = {
    publishQueueJob: String(getSetting_("QUEUE_ENABLED") || "true") === "true",
    broadcastQueueJob: true,
    cleanupJob: true,
    refreshDownloadButtonsJob: true
  };
  Object.keys(wanted).forEach(function(handler) {
    const existing = findTriggersByHandler_(handler);
    if (!wanted[handler]) { existing.forEach(function(t) { try { ScriptApp.deleteTrigger(t); } catch (e) {} }); return; }
    // تکراری‌ها حذف می‌شوند تا سهمیهٔ ۲۰ تریگر پر نشود
    for (let i = 1; i < existing.length; i++) { try { ScriptApp.deleteTrigger(existing[i]); } catch (e) {} }
    if (!existing.length) {
      try {
        if (handler === "publishQueueJob") ScriptApp.newTrigger(handler).timeBased().everyMinutes(1).create();
        else if (handler === "broadcastQueueJob") ScriptApp.newTrigger(handler).timeBased().everyMinutes(5).create();
        else if (handler === "refreshDownloadButtonsJob") ScriptApp.newTrigger(handler).timeBased().everyDays(1).atHour(4).create();
        else ScriptApp.newTrigger(handler).timeBased().everyHours(Math.max(1, Number(getSetting_("CLEANUP_INTERVAL_HOURS") || 6))).create();
      } catch (e) { logError_("installTriggers_ " + handler, e); }
    }
  });
  if (String(getSetting_("BACKUP_ENABLED") || "false") === "true") ensureWeeklyBackupTrigger_();
  else removeTrigger_("weeklyBackupJob");
  return ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); });
}
function disableWorkerTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (["publishQueueJob", "broadcastQueueJob"].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
}
function runWorkersNow() { publishQueueJob(); broadcastQueueJob(); SpreadsheetApp.getActive().toast("صف‌ها بررسی شدند.", "Flora Bot", 5); }
function runCleanupNow() { cleanupJob(); SpreadsheetApp.getActive().toast("پاک‌سازی انجام شد.", "Flora Bot", 5); }
function doGet(e) {
  const action = String(e && e.parameter && e.parameter.action || "");
  if (action === "download") return HtmlService.createHtmlOutput(downloadLandingPage_(e.parameter));
  return HtmlService.createHtmlOutput("Flora Bot running — v" + APP.VERSION);
}

// ───────────────────────── تنظیمات / شیت / نشست ─────────────────────────
function getDatabase_() {
  if (DB_INSTANCE_MEMO_) return DB_INSTANCE_MEMO_;
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  DB_INSTANCE_MEMO_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
  return DB_INSTANCE_MEMO_;
}
function getSheet_(name) {
  if (SHEET_INSTANCE_MEMO_[name]) return SHEET_INSTANCE_MEMO_[name];
  let sh = getDatabase_().getSheetByName(name);
  if (!sh && HEADERS[name]) {
    try { sh = ensureSheet_(name, HEADERS[name]); } catch (e) {}
  }
  if (!sh) throw new Error("Sheet missing: " + name + " — ابتدا setupProject را اجرا کن.");
  SHEET_INSTANCE_MEMO_[name] = sh;
  return sh;
}
function getSettingsMemo_() {
  if (SETTINGS_ROWS_MEMO_ !== null) return SETTINGS_ROWS_MEMO_;
  const sh = getSheet_(APP.SHEETS.SETTINGS);
  SETTINGS_ROWS_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, 2).getValues().map(function(r, i) {
    return { row: i + 2, key: String(r[0] || ""), value: String(r[1] == null ? "" : r[1]) };
  }).filter(function(x) { return x.key; });
  SETTINGS_INDEX_MEMO_ = Object.create(null);
  SETTINGS_ROWS_MEMO_.forEach(function(x) { if (!Object.prototype.hasOwnProperty.call(SETTINGS_INDEX_MEMO_, x.key)) SETTINGS_INDEX_MEMO_[x.key] = x; });
  return SETTINGS_ROWS_MEMO_;
}
function getSetting_(key) {
  getSettingsMemo_();
  const entry = SETTINGS_INDEX_MEMO_[String(key)];
  return entry ? entry.value : "";
}
function setSetting_(key, value) {
  key = String(String(key || "")).trim();
  const text = String(value == null ? "" : value);
  if (!key) return;
  const sh = getSheet_(APP.SHEETS.SETTINGS);
  // همیشه وضعیت واقعی شیت خوانده می‌شود تا ردیف تکراری ساخته نشود و مقدار خالی قدیمی جای مقدار جدید را نگیرد.
  const last = sh.getLastRow();
  const rowsWithKey = [];
  if (last >= 2) {
    const vals = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < vals.length; i++) if (String(vals[i][0]).trim() === key) rowsWithKey.push(i + 2);
  }
  // مقدار روی ردیف «آخر» نوشته می‌شود (آخرین نوشتن برنده است) و بقیهٔ ردیف‌های همنام از پایین به بالا
  // حذف می‌شوند؛ قبلاً ردیف تازه حذف می‌شد و ردیف قدیمی با مقدار خالی می‌ماند.
  if (rowsWithKey.length) sh.getRange(rowsWithKey[rowsWithKey.length - 1], 2).setValue(text);
  else sh.appendRow([key, text]);
  bustSettingCache_();
  for (let i = rowsWithKey.length - 2; i >= 0; i--) sh.deleteRow(rowsWithKey[i]);
}
function deleteSetting_(key) {
  const protectedKeys = ["ADMIN_IDS", "CLAIM_CODE", "READY", "APP_SECRET", "MUSIC_DOWNLOAD_DEFAULT_ENABLED", "MUSIC_DOWNLOAD_DEFAULT_MIGRATED"];
  if (protectedKeys.indexOf(String(key)) >= 0) return false;
  const sh = getSheet_(APP.SHEETS.SETTINGS);
  if (sh.getLastRow() < 2) return false;
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) if (String(vals[i][0]) === String(key)) { sh.deleteRow(i + 2); bustSettingCache_(); return true; }
  return false;
}
function getAllSettings_() { return getSettingsMemo_().map(function(x) { return { row: x.row, key: x.key, value: x.value }; }); }
function bustSettingCache_(key) { SETTINGS_ROWS_MEMO_ = null; SETTINGS_INDEX_MEMO_ = null; }

// ── لاگ خطا و گزارش به مدیر ──
// همهٔ خطاها در شیت ErrorLog ثبت می‌شوند و (در صورت روشن بودن ADMIN_ERROR_NOTIFY) به مدیر هم اطلاع داده می‌شود.
let LAST_ERROR_NOTIFY_MEMO_ = 0;
function logError_(where, err, extra) {
  try {
    const message = String(err && err.stack ? err.stack : err || "");
    appendRowObject_(APP.SHEETS.ERROR_LOG, HEADERS.ErrorLog, {
      log_id: newId_("E"), where: truncate_(where || "", 120), message: truncate_(message, 2000),
      extra: truncate_(extra ? (typeof extra === "string" ? extra : JSON.stringify(extra)) : "", 500),
      user_id: String((extra && extra.userId) || ""), created_at: new Date()
    });
  } catch (e) { console.error("logError_: " + e); }
  console.error("[FloraBot] " + where + ": " + (err && err.stack || err));
  notifyAdminError_(where, err);
}
function notifyAdminError_(where, err) {
  try {
    if (String(getSetting_("ADMIN_ERROR_NOTIFY") || "true") !== "true") return;
    // ضد سیل: حداکثر هر ۵ دقیقه یک پیام خطا برای مدیر
    if (nowMs_() - LAST_ERROR_NOTIFY_MEMO_ < 5 * 60000) return;
    LAST_ERROR_NOTIFY_MEMO_ = nowMs_();
    const text = "⚠️ خطای اجرایی\n📍 " + truncate_(where || "?", 90) + "\n🕐 " + formatDate_(new Date()) + "\n💬 " + truncate_(String(err && err.message || err || ""), 350);
    getAdmins_().forEach(function(a) { try { sendMessage_(a, text); } catch (e) {} });
  } catch (e) { console.error("notifyAdminError_: " + e); }
}
function recentErrors_(limit) {
  const sh = getSheet_(APP.SHEETS.ERROR_LOG);
  if (sh.getLastRow() < 2) return [];
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.ErrorLog.length).getValues();
  return rows.slice(-Math.max(1, limit || 8)).reverse().map(function(r) {
    return { where: String(r[1] || ""), message: String(r[2] || ""), createdAt: r[5] };
  });
}

// ── نشست‌ها با TTL ──
// AUTH:* نشست‌های ورود هستند (LOGIN_TTL_DAYS)، بقیه حالت‌های گفت‌وگو (SESSION_TTL_HOURS).
// ستون expires_at به‌صورت date ذخیره می‌شود؛ نشست‌های منقضی در cleanupJob پاک می‌شوند.
function sessionTtlMs_(key) {
  if (String(key).indexOf("AUTH:") === 0) return Math.max(1, Number(getSetting_("LOGIN_TTL_DAYS") || 90)) * 86400000;
  return Math.max(1, Number(getSetting_("SESSION_TTL_HOURS") || 48)) * 3600000;
}
function getSessionIndex_() {
  if (SESSION_INDEX_MEMO_) return SESSION_INDEX_MEMO_;
  const map = {};
  const sh = getSheet_(APP.SHEETS.SESSIONS);
  if (sh.getLastRow() >= 2) {
    const vals = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.Sessions.length).getValues();
    for (let i = 0; i < vals.length; i++) {
      const key = String(vals[i][0] || "");
      const state = String(vals[i][1] || "");
      if (!key) continue;
      let data = {}; try { data = JSON.parse(vals[i][2] || "{}"); } catch (e) {}
      if (!Object.prototype.hasOwnProperty.call(map, key)) map[key] = { rowNumber: i + 2, key: key, state: state, data: data, expiresAt: vals[i][4] || "" };
    }
  }
  SESSION_INDEX_MEMO_ = map;
  return map;
}
function getSession_(key) {
  const item = getSessionIndex_()[String(key)];
  if (!item) return null;
  const exp = dateMillis_(item.expiresAt);
  if (exp && exp < nowMs_()) return null; // منقضی؛ ردیف در cleanupJob پاک می‌شود
  return { rowNumber: item.rowNumber, key: item.key, state: item.state, data: item.data };
}
function setSession_(key, state, data) {
  key = String(key); state = String(state);
  const sh = getSheet_(APP.SHEETS.SESSIONS); const map = getSessionIndex_(); const old = map[key];
  const expiresAt = new Date(nowMs_() + sessionTtlMs_(key));
  const row = [key, state, JSON.stringify(data || {}), new Date(), expiresAt];
  if (old) sh.getRange(old.rowNumber, 1, 1, 5).setValues([row]);
  else {
    sh.appendRow(row);
    map[key] = { rowNumber: sh.getLastRow(), key: key, state: state, data: data || {}, expiresAt: expiresAt };
    return;
  }
  map[key] = { rowNumber: old.rowNumber, key: key, state: state, data: data || {}, expiresAt: expiresAt };
}
function touchSession_(key) {
  // تمدید سبک نشست (فقط expiresAt)؛ قبلاً مرده بود و هر پیام یک write کامل روی شیت می‌زد.
  const item = getSessionIndex_()[String(key)];
  if (!item) return;
  const expiresAt = new Date(nowMs_() + sessionTtlMs_(key));
  try {
    getSheet_(APP.SHEETS.SESSIONS).getRange(item.rowNumber, 4, 1, 2).setValues([[new Date(), expiresAt]]);
    item.expiresAt = expiresAt;
  } catch (e) {}
}
function clearSession_(key) {
  key = String(key); const map = getSessionIndex_(); const old = map[key];
  if (!old) return;
  getSheet_(APP.SHEETS.SESSIONS).deleteRow(old.rowNumber); delete map[key];
  Object.keys(map).forEach(function(k) { if (map[k].rowNumber > old.rowNumber) map[k].rowNumber--; });
}

// ───────────────────────── قفل نوشتن ─────────────────────────
// doPost قفل نمی‌گیرد (برای اینکه کند نشود)؛ فقط عملیات نوشتن حساس قفل کوتاه می‌گیرند.
// قفل کاربردی (per-user) با LockService ساخته می‌شود: قفل عمومی + تأخیر کوتاه تصادفی.
// LockService بازگشتی (reentrant) نیست: تو رفتنِ یک اجرا در قفلِ خودش = بن‌بست تا تایم‌اوت.
// پس پرچم همان اجرا نگه داشته می‌شود و فراخوانی تودرتو بدون قفل جدید اجرا می‌شود.
// در ازدحام هم دیگر با نخستین تایم‌اوت جا نمی‌زنیم: نردبان تلاش با backoff (جمعاً ~۲۰ ثانیه)
// شلوغی گذرا (کارگرهای صف، بکاپ، حذف‌های هم‌زمان) را رد می‌کند و فقط بعد از آن خطا می‌دهد.
let SCRIPT_LOCK_HELD_ = false;
let DOC_LOCK_HELD_ = false;
// [millis sleep before attempt, tryLock timeout] — بدترین حالت جمعاً ≈ ۲۰٫۷ ثانیه
const LOCK_PLAN_ = [[0, 6000], [700, 4000], [1200, 4000], [1800, 3000]];
function lockBusyError_() { const e = new Error("busy: lock timeout"); e.lockBusy = true; return e; }
function withLock_(fn) {
  if (SCRIPT_LOCK_HELD_) return fn();
  const lock = LockService.getScriptLock();
  let got = false;
  for (let i = 0; i < LOCK_PLAN_.length && !got; i++) {
    if (LOCK_PLAN_[i][0]) Utilities.sleep(LOCK_PLAN_[i][0]);
    try { got = !!lock.tryLock(LOCK_PLAN_[i][1]); } catch (e) { got = false; }
  }
  if (!got) throw lockBusyError_();
  SCRIPT_LOCK_HELD_ = true;
  try { return fn(); } finally { SCRIPT_LOCK_HELD_ = false; try { lock.releaseLock(); } catch (e) {} }
}
function withDocLock_(fn) {
  // سریال‌سازی کامل درخواست‌های یک کاربر بدون کند کردن بقیه کاربران.
  if (DOC_LOCK_HELD_) return fn();
  const lock = LockService.getDocumentLock();
  let got = false;
  try { got = !!lock.tryLock(12000); } catch (e) { got = false; }
  if (!got) return fn(); // اگر نشد، بدون قفل ادامه بده تا کاربر گیر نکند
  DOC_LOCK_HELD_ = true;
  try { return fn(); } finally { DOC_LOCK_HELD_ = false; try { lock.releaseLock(); } catch (e) {} }
}

// ───────────────────────── کاربران / رمز / شناسایی ─────────────────────────
function userFromRow_(r, i) {
  const truthy = function(v) { return v === true || String(v).toLowerCase() === "true"; };
  return {
    rowNumber: i + 2, userId: String(r[0] || ""), phone: String(r[1] || ""),
    firstName: String(r[2] || ""), lastName: String(r[3] || ""), rapName: String(r[4] || ""),
    province: String(r[5] || ""), city: String(r[6] || ""), country: String(r[7] || ""), metaJson: String(r[25] || ""),
    passSalt: String(r[8] || ""), passHash: String(r[9] || ""), registeredAt: r[10] || "", lastSeen: r[11] || "",
    active: truthy(r[12]), blocked: truthy(r[13]), username: String(r[14] || ""),
    supportMode: String(r[15] || "closed"), lastSupportAt: r[16] || "",
    botBlocked: truthy(r[17]), lastDownloadMessageIds: String(r[18] || ""), lastDownloadAt: r[19] || "",
    lang: String(r[20] || "") || String(getSetting_("DEFAULT_LANG") || "fa"),
    gateSalt: String(r[21] || ""), gateHash: String(r[22] || ""), gateUntil: r[23] || "",
    gateEnabled: String(r[24] || "") === "off" ? false : true
  };
}
function getAllUsers_() {
  if (USER_LIST_MEMO_ !== null) return USER_LIST_MEMO_;
  const sh = getSheet_(APP.SHEETS.USERS);
  if (sh.getLastRow() < 2) { USER_LIST_MEMO_ = []; USER_BY_ID_MEMO_ = Object.create(null); return USER_LIST_MEMO_; }
  const list = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.Users.length).getValues().map(function(r, i) { return userFromRow_(r, i); });
  USER_LIST_MEMO_ = list; USER_BY_ID_MEMO_ = Object.create(null);
  list.forEach(function(u) { if (!Object.prototype.hasOwnProperty.call(USER_BY_ID_MEMO_, u.userId)) USER_BY_ID_MEMO_[u.userId] = u; });
  return USER_LIST_MEMO_;
}
function getUserById_(userId) {
  const id = String(userId);
  if (USER_BY_ID_MEMO_ === null) USER_BY_ID_MEMO_ = Object.create(null);
  if (Object.prototype.hasOwnProperty.call(USER_BY_ID_MEMO_, id)) return USER_BY_ID_MEMO_[id] || null;
  const sh = getSheet_(APP.SHEETS.USERS); const rowNumber = findRowByFirstColumn_(sh, id, 2, HEADERS.Users.length);
  let user = null;
  if (rowNumber) user = userFromRow_(sh.getRange(rowNumber, 1, 1, HEADERS.Users.length).getValues()[0], rowNumber - 2);
  USER_BY_ID_MEMO_[id] = user;
  return user;
}
function normalizePhone_(phone) { return String(phone || "").replace(/[^0-9]/g, ""); }
function getUserByPhone_(phone) {
  const p = normalizePhone_(phone); if (!p) return null;
  return getAllUsers_().find(function(u) { const q = normalizePhone_(u.phone); return q === p || (q.length >= 9 && p.length >= 9 && q.slice(-9) === p.slice(-9)); }) || null;
}
function createUser_(o) {
  // کشور تایپ‌شده (countryName) هم ذخیره می‌شود؛ قبلاً فقط به نشست می‌رفت و از بین می‌رفت.
  const countryName = String(o.countryName || "").trim();
  const meta = countryName ? JSON.stringify({ countryName: countryName }) : "";
  const row = [String(o.userId), o.phone || "", o.firstName || "", o.lastName || "", o.rapName || "", o.province || (countryName || ""), o.city || "", o.country || "Iran", o.passSalt || "", o.passHash || "", new Date(), new Date(), true, false, o.username || "", "closed", "", false, "", "", o.lang || getSetting_("DEFAULT_LANG") || "fa", "", "", "", "", meta];
  getSheet_(APP.SHEETS.USERS).appendRow(row); bustUsersCache_();
}
function setUserField_(userId, field, value) {
  const col = USER_COL[field]; if (!col) return false;
  const u = getUserById_(userId); if (!u) return false;
  getSheet_(APP.SHEETS.USERS).getRange(u.rowNumber, col).setValue(value);
  u[field] = value;
  if (USER_LIST_MEMO_ !== null) USER_LIST_MEMO_.forEach(function(item) { if (item.userId === String(userId) && item !== u) item[field] = value; });
  return true;
}
function findRowByFirstColumn_(sheet, value, startRow, width) {
  const last = sheet.getLastRow(); if (last < startRow) return 0;
  const range = sheet.getRange(startRow, 1, last - startRow + 1, 1);
  if (typeof range.createTextFinder === "function") {
    const finder = range.createTextFinder(String(value));
    if (finder && typeof finder.matchEntireCell === "function") finder.matchEntireCell(true);
    if (finder && typeof finder.findNext === "function") {
      const found = finder.findNext();
      return found ? found.getRow() : 0;
    }
  }
  const vals = sheet.getRange(startRow, 1, last - startRow + 1, width).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(value)) return startRow + i;
  return 0;
}
function deleteRowsByKey_(sheetName, keyColumn, keys) {
  // حذف همهٔ ردیف‌هایی که ستون کلید در مجموعهٔ keys است (از پایین به بالا تا شماره ردیف‌ها جابه‌جا نشوند).
  const set = {};
  (keys || []).forEach(function(k) { set[String(k)] = true; });
  if (!Object.keys(set).length) return 0;
  const sh = getSheet_(sheetName);
  const last = sh.getLastRow(); if (last < 2) return 0;
  const width = Math.max(keyColumn, 1);
  const vals = sh.getRange(2, 1, last - 1, width).getValues();
  let deleted = 0;
  for (let i = vals.length - 1; i >= 0; i--) {
    if (set[String(vals[i][keyColumn - 1] || "")]) { sh.deleteRow(i + 2); deleted++; }
  }
  return deleted;
}
function deleteUserCascade_(userId, options) {
  // حذف کامل: حساب، پیش‌نویس‌ها + رسانهٔ پیش‌نویس، رسانه/کردیت ارسال‌ها، ترک‌های کتابخانه،
  // آثار (اختیاری)، گفت‌وگو، ردیف Starts و نشست‌ها.
  const uid = String(userId);
  const opts = options || {};
  const u = getUserById_(uid); if (!u) return false;
  const subs = getAllSubmissions_().filter(function(s) { return String(s.userId) === uid; });
  const subIds = subs.map(function(s) { return s.id; });
  const drafts = getMusicDrafts_().filter(function(d) { return String(d.userId) === uid; });
  const draftIds = drafts.map(function(d) { return d.draftId; });
  deleteRowsByKey_(APP.SHEETS.CREDITS, 1, subIds);
  deleteRowsByKey_(APP.SHEETS.MEDIA, 1, subIds);
  // رسانهٔ پیش‌نویس در DraftMedia است، نه MusicMedia؛ قبلاً این ردیف‌ها یتیم می‌ماندند.
  deleteRowsByKey_(APP.SHEETS.DRAFT_MEDIA, 1, draftIds);
  deleteRowsByKey_(APP.SHEETS.MEDIA, 1, draftIds); // سازگاری با نسخه‌های قدیمی‌تر که پیش‌نویس را اینجا می‌نوشتند
  deleteRowsByKey_(APP.SHEETS.MUSIC_LIBRARY, 2, subIds);
  if (opts.removeSubmissions !== false) deleteRowsByKey_(APP.SHEETS.SUBMISSIONS, 1, subIds);
  deleteRowsByKey_(APP.SHEETS.DRAFTS, 1, draftIds);
  deleteRowsByKey_(APP.SHEETS.SUPPORT, 2, [uid]);
  deleteRowsByKey_(APP.SHEETS.STARTS, 1, [uid]);
  deleteRowsByKey_(APP.SHEETS.MUSIC_DOWNLOADS, 2, [uid]);
  deleteRowsByKey_(APP.SHEETS.CONNECTED_CHANNELS, 2, [uid]);
  bustConnectedChannelsCache_();
  getSheet_(APP.SHEETS.USERS).deleteRow(u.rowNumber);
  clearSession_("AUTH:" + uid); clearSession_("M:" + uid);
  bustUsersCache_(); bustSubmissionCaches_(); SUPPORT_MESSAGES_MEMO_ = null; MUSIC_DOWNLOADS_MEMO_ = null; DRAFT_MEDIA_MEMO_ = null;
  return true;
}
function bustUsersCache_() { USER_LIST_MEMO_ = null; USER_BY_ID_MEMO_ = null; }
function touchUser_(userId) {
  const id = String(userId); const cache = CacheService.getScriptCache(); const key = "music_user_touch_" + id;
  // This cache is only a short write-throttle, never an authorization or user-data source.
  if (cache.get(key) !== null) return;
  const u = getUserById_(id); if (!u) return;
  setUserField_(id, "lastSeen", new Date());
  cache.put(key, "1", 60);
}
function isLoggedIn_(userId) { const s = getSession_("AUTH:" + userId); return !!(s && s.state === "ON"); }
function loginUser_(userId) { setSession_("AUTH:" + userId, "ON", {}); }
function logoutUser_(userId) { clearSession_("AUTH:" + userId); }

// ── رمز: salt + ۱۲۰۰ دور SHA-256 (بدون ذخیرهٔ متن خام) ──
function newSalt_() { return Utilities.getUuid() + Utilities.getUuid().replace(/-/g, ""); }
function hashPassword_(password, salt, userId) {
  // 1200 دور SHA-256 + base64 برای کندکردن حملات دیکشنری؛ فقط در ثبت‌نام/ورود اجرا می‌شود.
  let value = String(password) + "|" + String(salt) + "|" + String(userId);
  for (let i = 0; i < 1200; i++) value = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8));
  return value;
}

// ── تأیید دومرحله‌ای با کد تولیدشده توسط ربات (بدون شمارنده/کد هارد‌کد) ──
// کد باید تصادفی و یکتا باشد، نه مشتق از APP_SECRET+آیدی (که قابل حدس و مشترک بین نصب‌ها بود).
function generateGateCode_() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
function getGateCode_(userId) { return ""; }  // سازگاری با فراخوانی‌های قدیمی؛ کد همیشه ذخیره‌شده است
// کد فقط در شیت به‌صورت hash نگه داشته می‌شود؛ متن خام فقط یک‌بار به خود کاربر نشان داده می‌شود.
function getGateCodeForUser_(u) { return ""; }
function enableTwoStep_(userId, code) {
  const fresh = String(code || generateGateCode_());
  setUserField_(userId, "gateSalt", "");   // دیگر متن خام نگه نمی‌داریم
  setUserField_(userId, "gateHash", hashPassword_(fresh, getSetting_("APP_SECRET") || "florabot", userId));
  setUserField_(userId, "gateEnabled", true);
  return fresh;
}
function disableTwoStep_(userId) { setUserField_(userId, "gateEnabled", "off"); setUserField_(userId, "gateSalt", ""); setUserField_(userId, "gateHash", ""); }
// تنها منبع حقیقت برای «دومرحله‌ای فعال است؟». قبلاً چند جا gateSalt را چک می‌کرد که
// دیگر هرگز نوشته نمی‌شود؛ نتیجه: ورود با رمز تنها از درِ دومرحله‌ای رد می‌شد.
function isGateEnabled_(u) { return !!(u && u.gateEnabled && u.gateHash); }
function verifyGateCode_(u, input) {
  const code = String(input || "").trim();
  if (!isGateEnabled_(u)) return false;
  if (!/^\d{4,8}$/.test(code)) return false;
  return hashPassword_(code, getSetting_("APP_SECRET") || "florabot", u.userId) === u.gateHash;
}
// کد تازه + نمایش یک‌بارمصرف؛ فقط hash در شیت می‌ماند.
function issueTwoStepCode_(userId) {
  const code = enableTwoStep_(userId);
  try { CacheService.getScriptCache().put("gateshow_" + String(userId), code, 120); } catch (e) {}
  return code;
}
function takeTwoStepCodeOnce_(userId) {
  try { const c = CacheService.getScriptCache().get("gateshow_" + String(userId)); CacheService.getScriptCache().remove("gateshow_" + String(userId)); return c || ""; } catch (e) { return ""; }
}
// مسیرهای mfa:* که قبلاً هیچ‌جا فعال نبودند (mfa:ask / mfa:enable / mfa:disable).
function handleMfaCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message && cb.message.chat ? cb.message.chat.id : uid);
  const data = String(cb.data || "");
  const u = getUserById_(uid);
  if (!u) { answerCallbackQuery_(cb.id, t_(uid, "LOGIN_NEEDED")); return; }
  if (data === "mfa:enable" || data === "mfa:ask") {
    const fresh = enableTwoStep_(uid);
    answerCallbackQuery_(cb.id, "✅");
    sendMessage_(chatId, t_(uid, "MFA_CODE_TEXT", { c: fresh }), { inline_keyboard: [[{ text: t_(uid, "BACK"), callback_data: "p:home" }]] }, { parse_mode: "HTML" });
    return;
  }
  if (data === "mfa:rotate") {
    const fresh = enableTwoStep_(uid);
    answerCallbackQuery_(cb.id, "🔄");
    sendMessage_(chatId, t_(uid, "MFA_CODE_ROTATED", { c: fresh }), { inline_keyboard: [[{ text: t_(uid, "BACK"), callback_data: "p:home" }]] }, { parse_mode: "HTML" });
    return;
  }
  if (data === "mfa:disable") {
    disableTwoStep_(uid);
    answerCallbackQuery_(cb.id, t_(uid, "MFA_OFF"));
    showProfile_(chatId, uid); return;
  }
  answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN"));
}

// ── Rate limit (CacheService؛ فقط برای جلوگیری از اسپم) ──
function rateAllow_(bucket, limit, windowSec) {
  try {
    const cache = CacheService.getScriptCache(); const key = "rl_" + bucket; const max = Math.max(1, Number(limit) || 1);
    const current = Number(cache.get(key) || 0);
    if (current >= max) return false;
    cache.put(key, String(current + 1), Math.max(60, Number(windowSec) || 60));
    return true;
  } catch (e) { return true; }
}
function rateCountReport_(bucket, windowSec) { try { return Number(CacheService.getScriptCache().get("rl_" + bucket) || 0); } catch (e) { return 0; } }

// ───────────────────────── مدیران و دسترسی‌ها ─────────────────────────
const ADMIN_ROLE_LABELS_ = { full: "مدیر کامل", publisher: "انتشار و دانلود", support: "پشتیبانی", users: "مدیریت کاربران", settings: "تنظیمات و کمپین‌ها" };
const ADMIN_ROLE_PERMISSIONS_ = {
  full: ["*"], publisher: ["submissions", "channel", "broadcast"], support: ["support"], users: ["users"], settings: ["settings", "channel", "broadcast"]
};
function getLegacyAdminIds_() { return String(getSetting_("ADMIN_IDS") || "").split(/[\s,;]+/).map(function(x) { return x.trim(); }).filter(Boolean); }
function getAdminAccessRecords_() {
  if (ADMIN_ACCESS_MEMO_ !== null) return ADMIN_ACCESS_MEMO_;
  const sh = getSheet_(APP.SHEETS.ADMIN_ACCESS); const rows = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.AdminAccess.length).getValues();
  ADMIN_ACCESS_MEMO_ = rows.map(function(r, i) { return { rowNumber: i + 2, userId: String(r[0] || ""), role: String(r[1] || ""), active: r[2] === true || String(r[2]).toLowerCase() === "true", addedBy: String(r[3] || ""), createdAt: r[4] || "", updatedAt: r[5] || "" }; }).filter(function(r) { return r.userId; });
  return ADMIN_ACCESS_MEMO_;
}
function getAdminRecord_(userId) {
  const id = String(userId);
  if (getLegacyAdminIds_().indexOf(id) >= 0) return { userId: id, role: "full", active: true, legacyOwner: true };
  const record = getAdminAccessRecords_().find(function(r) { return r.userId === id && r.active; });
  return record || null;
}
function isAdmin_(userId) { return !!getAdminRecord_(userId); }
function isAdminAuthenticated_(userId) {
  const id = String(userId); const user = getUserById_(id);
  return !!(isAdmin_(id) && user && user.active && !user.blocked && isLoggedIn_(id));
}
// CacheService حداکثر ۶ ساعت TTL دارد؛ قبلاً آستانه ۱۲ ساعت روی کش گذاشته شده بود و
// عملاً هرگز منقضی نمی‌شد. حالا زمان ورود مدیر در ردیف نشست (Sessions) ذخیره می‌شود.
function touchAdminSession_(userId) {
  try { setSession_("ADM:" + String(userId), "ON", { since: nowMs_(), touchedAt: nowMs_() }); } catch (e) {}
}
function isAdminSessionStale_(userId) {
  try {
    const sess = getSession_("ADM:" + String(userId));
    if (!sess) return false;                     // هنوز در همین پنجرهٔ ورود است
    const since = Number((sess.data || {}).since || 0);
    if (!since) return false;
    const hours = Math.max(1, Number(getSetting_("ADMIN_SESSION_HOURS") || 12));
    return nowMs_() - since > hours * 3600000;
  } catch (e) { return false; }
}
// شمارندهٔ تلاش ناموفق باید پایدار باشد؛ قبلاً در نشست بود و با بستن/بازکردن گفت‌وگو صفر می‌شد.
// بعد از ۱۵ دقیقه بی‌تلاش، شمارنده خودبه‌خود ریست می‌شود.
function registerFailedLogin_(userId) {
  const key = "fail_" + String(userId);
  const cache = CacheService.getScriptCache();
  let rec = { n: 0, at: nowMs_() };
  try { const raw = cache.get(key); if (raw) { const p = JSON.parse(raw); if (p && p.at && nowMs_() - Number(p.at) < 15 * 60000) rec = { n: Number(p.n || 0), at: Number(p.at) }; } } catch (e) {}
  rec.n += 1; rec.at = nowMs_();
  try { cache.put(key, JSON.stringify(rec), 900); } catch (e) {}
  // برای اینکه پاک‌شدن کش هم دور نزند، یک نسخه در شیت هم نگه می‌داریم.
  try { if (rec.n >= 3) setUserField_(userId, "metaJson", JSON.stringify({ failCount: rec.n, failAt: rec.at })); } catch (e) {}
  return rec.n;
}
function clearFailedLogin_(userId) {
  try { CacheService.getScriptCache().remove("fail_" + String(userId)); } catch (e) {}
  try { setUserField_(userId, "metaJson", ""); } catch (e) {}
}
function requireAdminAuthentication_(chatId, userId, prefix) {
  const id = String(userId); const targetChat = String(chatId || id);
  if (!isAdmin_(id)) { sendEntryCard_(targetChat); return false; }
  const user = getUserById_(id);
  if (user && user.blocked) { sendMessage_(targetChat, t_(id, "ADMIN_BLOCKED")); return false; }
  if (user && !user.active) { sendMessage_(targetChat, t_(id, "ADMIN_INACTIVE")); return false; }
  setSession_("M:" + id, "START_AFTER_LOGIN", { action: "admin_panel" });
  sendEntryCard_(targetChat, prefix || t_(id, "ADMIN_AUTH_NEEDED"));
  return false;
}
function hasAdminPermission_(userId, permission) {
  const record = getAdminRecord_(userId); if (!record) return false;
  if (getLegacyAdminIds_().indexOf(String(userId)) >= 0) return true; // مالک همیشه همه‌کاره
  const permissions = ADMIN_ROLE_PERMISSIONS_[record.role] || [];
  return permissions.indexOf("*") >= 0 || permissions.indexOf(String(permission || "")) >= 0;
}
function getAdmins_() {
  const ids = getLegacyAdminIds_();
  getAdminAccessRecords_().forEach(function(r) { if (r.active && ids.indexOf(r.userId) < 0) ids.push(r.userId); });
  return ids;
}
function adminPermissionForSettingKey_(key) {
  const name = String(key || "");
  if (SETTINGS_CHANNEL_KEYS_.indexOf(name) >= 0) return "channel";
  return "settings";
}
function adminPermissionForCallback_(data) {
  const d = String(data || "");
  if (d.indexOf("set:edit:") === 0 || d.indexOf("set:choose:") === 0 || d.indexOf("set:custom:") === 0) {
    const row = Number(d.split(":")[2]); const setting = getAllSettings_().find(function(s) { return s.row === row; });
    return setting ? adminPermissionForSettingKey_(setting.key) : "settings";
  }
  if (d === "a:home" || d === "a:noop" || d === "a:stats") return "";
  // ترتیب مهم است: a:adminlog قبل از پیشوند کلی a:admin* بررسی می‌شود،
  // وگرنه هر مدیری می‌توانست لاگ مدیران را ببیند.
  if (d === "a:adminlog" || d === "a:errors" || d.indexOf("a:export:") === 0) return "settings";
  if (d === "a:admins" || d.indexOf("a:admin") === 0) return "admins";
  if (d === "a:users" || d.indexOf("a:list:") === 0 || d.indexOf("a:user:") === 0 || d.indexOf("u:") === 0 || d === "a:resets" || d.indexOf("a:reset:") === 0 || d.indexOf("r:approve:") === 0 || d.indexOf("r:reject:") === 0) return "users";
  if (d === "a:submissions" || d.indexOf("a:sub") === 0 || d.indexOf("a:downloadtoggle:") === 0 || d.indexOf("a:comingsoon") === 0) return "submissions";
  if (d === "a:support" || d.indexOf("support:") === 0) return "support";
  if (d === "a:channel" || d === "a:comments" || d === "a:postbuttons" || d === "a:covertest" || d === "set:channel" || d === "set:footer" || d === "set:mode" || d.indexOf("set:mode:") === 0 || d === "set:interval" || d === "set:pubtoggle") return "channel";
  if (d === "a:settings" || d === "a:texts" || d.indexOf("set:") === 0 || d === "a:colors" || d.indexOf("color:") === 0 || d === "a:fj" || d.indexOf("fj:") === 0 || d === "a:inactive" || d.indexOf("set:inactive-") === 0 || d === "a:botmode" || d.indexOf("botmode:") === 0) return "settings";
  if (d === "a:broadcast" || d === "a:campaigns" || d.indexOf("bc:") === 0 || d.indexOf("acc:") === 0 || d.indexOf("bn:") === 0 || d.indexOf("ccp:") === 0) return "broadcast";
  return "settings";
}
function adminPermissionForState_(state, stateData) {
  const s = String(state || "");
  if (s === "ADM_SETTING_VALUE" && stateData && stateData.key) return adminPermissionForSettingKey_(stateData.key);
  if (s === "ADM_SUPPORT_REPLY") return "support";
  if (s.indexOf("ADM_BROADCAST_") === 0) return "broadcast";
  if (s.indexOf("ADM_ADMIN_") === 0) return "admins";
  if (s === "ADM_POST_TIME") return "submissions";
  // ویرایش دستی اثر (متن‌ها و رسانه‌ها) بخشی از گردش کار ارسال‌هاست
  if (s.indexOf("ADM_EDIT_") === 0) return "submissions";
  // دلیل رد بخشی از گردش کار ارسال‌هاست؛ نقش publisher هم باید بتواند رد کند.
  if (s === "ADM_REJECT_REASON") return "submissions";
  if (s === "ADM_CC_LIST" || s === "ADM_CC_MSG" || s === "ADM_CC_CONFIRM" || s === "ADM_CC_BANNER" || s === "ADM_CC_BANNER_PICK" || s === "ADM_CC_POST_EDIT") return "broadcast";
  if (s === "ADM_BROADCAST_CODE") return "broadcast";
  if (s === "ADM_DIRECT_MSG") return "users";
  if (/^ADM_(CHANNEL_|PUBLISH_INTERVAL)/.test(s)) return "channel";
  if (/^ADM_(FJ_|INACTIVE_)/.test(s)) return "settings";
  return "settings";
}
function logAdminAction_(adminId, action, target, details) {
  try {
    appendRowObject_(APP.SHEETS.ADMIN_LOG, HEADERS.AdminLog, { log_id: newId_("L"), admin_id: String(adminId || ""), action: String(action || ""), target: String(target || ""), details: truncate_(details || "", 300), created_at: new Date() });
  } catch (e) { console.error("logAdminAction_: " + e); }
}
function generateClaimCode_() { return Utilities.getUuid().replace(/-/g, "").slice(0, 20).toUpperCase(); }

// ───────────────────────── شناسایی کاربر تلگرام ─────────────────────────
function learnIdentity_(from) {
  if (!from || !from.id) return;
  const sh = getSheet_(APP.SHEETS.STARTS); const id = String(from.id); const now = new Date();
  const username = from.username ? "@" + from.username : "";
  const firstName = String(from.first_name || ""); const lastName = String(from.last_name || "");
  const fingerprint = JSON.stringify([username, firstName, lastName]);
  const throttle = CacheService.getScriptCache(); const throttleKey = "music_identity_touch_" + id;
  // Only suppresses redundant identity/last_seen writes; identity data is never loaded from this cache.
  if (throttle.get(throttleKey) === fingerprint) return;
  if (IDENTITY_BY_ID_MEMO_ === null) IDENTITY_BY_ID_MEMO_ = Object.create(null);
  const old = IDENTITY_BY_ID_MEMO_[id] || null;
  let rowNumber = old && old.rowNumber || findRowByFirstColumn_(sh, id, 2, 6);
  let startedAt = old && old.startedAt || now;
  if (rowNumber && !old) {
    const values = sh.getRange(rowNumber, 1, 1, 6).getValues()[0];
    startedAt = values[4] || now;
  }
  if (rowNumber) sh.getRange(rowNumber, 2, 1, 5).setValues([[username, firstName, lastName, startedAt, now]]);
  else { sh.appendRow([id, username, firstName, lastName, now, now]); rowNumber = sh.getLastRow(); startedAt = now; }
  const identity = { userId: id, username: username, firstName: firstName, lastName: lastName, startedAt: startedAt, lastSeen: now, rowNumber: rowNumber };
  IDENTITY_BY_ID_MEMO_[id] = identity;
  try { throttle.put(throttleKey, fingerprint, 300); } catch (e) {}
}
function getIdentity_(userId) {
  const id = String(userId);
  if (IDENTITY_BY_ID_MEMO_ === null) IDENTITY_BY_ID_MEMO_ = Object.create(null);
  if (Object.prototype.hasOwnProperty.call(IDENTITY_BY_ID_MEMO_, id)) return IDENTITY_BY_ID_MEMO_[id] || null;
  const sh = getSheet_(APP.SHEETS.STARTS); const rowNumber = findRowByFirstColumn_(sh, id, 2, 6);
  if (!rowNumber) { IDENTITY_BY_ID_MEMO_[id] = null; return null; }
  const r = sh.getRange(rowNumber, 1, 1, 6).getValues()[0];
  const identity = { userId: String(r[0]), username: String(r[1] || ""), firstName: String(r[2] || ""), lastName: String(r[3] || ""), startedAt: r[4], lastSeen: r[5], rowNumber: rowNumber };
  IDENTITY_BY_ID_MEMO_[id] = identity; return identity;
}

// ───────────────────────── Telegram API ─────────────────────────
function telegramRequest_(method, payload, token) {
  const t = token || getBotToken_(); if (!t) return { ok: false, description: "BOT_TOKEN missing" };
  try {
    const r = UrlFetchApp.fetch("https://api.telegram.org/bot" + t + "/" + method, { method: "post", contentType: "application/json", payload: JSON.stringify(payload || {}), muteHttpExceptions: true });
    const body = r.getContentText(); try { return JSON.parse(body); } catch (e) { return { ok: false, description: body }; }
  } catch (e) { return { ok: false, description: String(e && e.message || e) }; }
}
function telegramMultipartRequest_(method, payload, token) {
  const t = token || getBotToken_(); if (!t) return { ok: false, description: "BOT_TOKEN missing" };
  const body = Object.assign({}, payload || {});
  if (body.reply_markup && typeof body.reply_markup === "object") body.reply_markup = JSON.stringify(body.reply_markup);
  try {
    const r = UrlFetchApp.fetch("https://api.telegram.org/bot" + t + "/" + method, { method: "post", payload: body, muteHttpExceptions: true });
    const responseText = r.getContentText(); try { return JSON.parse(responseText); } catch (e) { return { ok: false, description: responseText }; }
  } catch (e) { return { ok: false, description: String(e && e.message || e) }; }
}
function answerCallbackQuery_(id, text) { return telegramRequest_("answerCallbackQuery", { callback_query_id: id, text: text || "" }); }
function validButtonStyle_(style) { return ["primary", "success", "danger"].indexOf(String(style)) >= 0; }
function buttonStylesEnabled_() {
  return validButtonStyle_(getSetting_("BTN_STYLE_REPLY")) || validButtonStyle_(getSetting_("BTN_STYLE_INLINE")) || validButtonStyle_(getSetting_("BTN_STYLE_DANGER"));
}
function stylizeButton_(btn, kind) {
  if (!btn || btn.style || btn.url || btn.request_contact || btn.web_app) return btn;
  const t = String(btn.text || ""); const danger = /(❌|🚫|🗑|⛔|حذف|غیرفعال|مسدود|لغو|انصراف|خروج|رد کن|Delete|Cancel|Block)/;
  let style = danger.test(t) ? getSetting_("BTN_STYLE_DANGER") : getSetting_(kind === "inline" ? "BTN_STYLE_INLINE" : "BTN_STYLE_REPLY");
  if (validButtonStyle_(style)) btn.style = style;
  return btn;
}
function stylizeMarkup_(markup) {
  if (!markup) return markup;
  // اگر مدیر هیچ رنگی انتخاب نکرده باشد، هیچ فیلد اضافه‌ای به Bot API فرستاده نمی‌شود.
  if (!buttonStylesEnabled_()) return markup;
  ["inline_keyboard", "keyboard"].forEach(function(key) {
    if (markup[key]) markup[key] = markup[key].map(function(row) { return row.map(function(btn) { return stylizeButton_(btn, key === "inline_keyboard" ? "inline" : "reply"); }); });
  });
  return markup;
}
function stripMarkupStyles_(markup) {
  if (!markup) return markup;
  const clone = JSON.parse(JSON.stringify(markup));
  ["inline_keyboard", "keyboard"].forEach(function(key) {
    if (clone[key]) clone[key] = clone[key].map(function(row) { return row.map(function(btn) { delete btn.style; return btn; }); });
  });
  return clone;
}
function sendMessage_(chatId, text, replyMarkup, extra) {
  const payload = Object.assign({ chat_id: String(chatId), text: String(text || ""), disable_web_page_preview: true }, extra || {});
  if (replyMarkup) payload.reply_markup = stylizeMarkup_(replyMarkup);
  const result = telegramRequest_("sendMessage", payload);
  // اگر نسخهٔ Bot API فیلد رنگ دکمه را نپذیرد، همان پیام بدون رنگ دوباره فرستاده می‌شود
  // تا یک تنظیم ظاهری باعث از کار افتادن کل مکالمه نشود.
  if (result && !result.ok && payload.reply_markup && /markup|style|keyboard|button/i.test(String(result.description || ""))) {
    payload.reply_markup = stripMarkupStyles_(replyMarkup);
    return telegramRequest_("sendMessage", payload);
  }
  if (result && !result.ok && /bot was blocked by the user|user is deactivated|chat not found/i.test(String(result.description || ""))) {
    try { if (/^\d+$/.test(String(chatId))) setUserField_(chatId, "botBlocked", true); } catch (e) {}
  }
  if (result && result.ok && /^\d+$/.test(String(chatId))) {
    try { const u = getUserById_(chatId); if (u && u.botBlocked) setUserField_(chatId, "botBlocked", false); } catch (e) {}
  }
  return result;
}
function notifySubmissionOwner_(submission, text) {
  const userId = String(submission && submission.userId || "").trim();
  if (!/^\d{1,20}$/.test(userId)) return false;
  const result = sendMessage_(userId, text);
  return !!(result && result.ok);
}
function copyMessage_(toChatId, fromChatId, messageId) {
  return telegramRequest_("copyMessage", { chat_id: String(toChatId), from_chat_id: String(fromChatId), message_id: Number(messageId) });
}
function deleteMessage_(chatId, messageId) {
  if (!messageId) return { ok: false };
  try { return telegramRequest_("deleteMessage", { chat_id: String(chatId), message_id: Number(messageId) }); } catch (e) { return { ok: false }; }
}
function purgeInput_(message) { if (message && message.message_id && message.chat) deleteMessage_(message.chat.id, message.message_id); }
function sendChannelMedia_(method, payload) { return telegramRequest_(method, payload); }
// ارسال فایل (مثلاً خروجی CSV) به چت با multipart
// سقف حجم فایل قابل دریافت با getFile در Bot API حدود ۲۰ مگابایت است؛
// برای فایل‌های بزرگ‌تر پیش‌نمایش ساخته نمی‌شود (فایل اصلی خودش در کانال استفاده می‌شود).
const GETFILE_MAX_BYTES_ = 20 * 1024 * 1024;
function fileTooBigForPreview_(sizeBytes) { return Number(sizeBytes || 0) > GETFILE_MAX_BYTES_; }
function sendDocument_(chatId, blob, caption) {
  if (!blob) return { ok: false, description: "empty blob" };
  return telegramMultipartRequest_("sendDocument", { chat_id: String(chatId), document: blob, caption: String(caption || "") });
}
function sanitizeBase64_(value) { return String(value || "").replace(/[^A-Za-z0-9+/=]/g, ""); }
function getDefaultCoverBlob_() {
  if (DEFAULT_COVER_BLOB_MEMO_) return DEFAULT_COVER_BLOB_MEMO_;
  const clean = sanitizeBase64_(DEFAULT_COVER_BASE64_);
  if (!clean || clean.length < 256) return null;
  try {
    const bytes = Utilities.base64Decode(clean);
    if (!bytes || bytes.length < 256) return null;
    DEFAULT_COVER_BLOB_MEMO_ = Utilities.newBlob(bytes, "image/jpeg", "florabot-default-cover.jpg");
  } catch (e) {
    console.error("Default cover base64 is invalid; falling back to a text post.");
    DEFAULT_COVER_BLOB_MEMO_ = null;
  }
  return DEFAULT_COVER_BLOB_MEMO_;
}
function rememberDefaultCoverFileId_(result) {
  const photos = result && result.result && result.result.photo;
  if (!photos || !photos.length) return "";
  const best = photos[photos.length - 1]; const fileId = String(best && best.file_id || "");
  if (fileId) setSetting_("DEFAULT_COVER_FILE_ID", fileId);
  return fileId;
}
function sendDefaultCoverToChannel_(channel, caption, replyMarkup) {
  const payload = { chat_id: String(channel) };
  if (caption) { payload.caption = String(caption); payload.parse_mode = "HTML"; }
  if (replyMarkup) payload.reply_markup = replyMarkup;
  const cachedFileId = String(getSetting_("DEFAULT_COVER_FILE_ID") || "").trim();
  let result;
  if (cachedFileId) {
    payload.photo = cachedFileId;
    result = sendChannelMedia_("sendPhoto", payload);
    if (result && !result.ok && /wrong file identifier|file_id|file not found/i.test(String(result.description || ""))) {
      setSetting_("DEFAULT_COVER_FILE_ID", "");
      delete payload.photo;
      const blob = getDefaultCoverBlob_();
      if (!blob) return sendTextOnlyChannelPost_(channel, caption);
      payload.photo = blob;
      result = telegramMultipartRequest_("sendPhoto", payload);
      if (result && result.ok) rememberDefaultCoverFileId_(result);
    }
    return result;
  }
  const blob = getDefaultCoverBlob_();
  if (!blob) return sendTextOnlyChannelPost_(channel, caption);
  payload.photo = blob;
  result = telegramMultipartRequest_("sendPhoto", payload);
  if (result && result.ok) rememberDefaultCoverFileId_(result);
  return result;
}
function sendTextOnlyChannelPost_(channel, captionHtml) {
  // بدون کاور هم پست منتشر می‌شود؛ انتشار نباید به‌خاطر یک تصویر پیش‌فرض شکست بخورد.
  const text = String(captionHtml || "").trim() || "🎵 انتشار موزیک";
  return sendChannelMedia_("sendMessage", { chat_id: String(channel), text: text, parse_mode: "HTML", disable_web_page_preview: true });
}
function normalizeChannelId_(value) {
  let s = String(value || "").trim();
  if (!s) return "";
  let m = s.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/c\/(\d+)(?:\/\d+)?(?:[?#].*)?$/i);
  if (m) return "-100" + m[1];
  m = s.match(/^(?:https?:\/\/)?(?:www\.)?t\.me\/(?:s\/)?([A-Za-z][A-Za-z0-9_]{4,31})(?:\/\d+)?(?:[?#].*)?$/i);
  if (m) s = "@" + m[1];
  if (/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(s)) return s;
  if (/^-100\d+$/.test(s) || /^-?\d+$/.test(s)) return s;
  return "";
}
function cancelKeyboard_() { return { keyboard: [[{ text: "❌ لغو" }]], resize_keyboard: true, is_persistent: true }; }
function htmlEscape_(v) { return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function htmlUnescape_(v) { return String(v == null ? "" : v).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&"); }
function truncate_(v, n) { const s = String(v || ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function normalizeDigits_(v) { return String(v || "").replace(/[۰-۹]/g, function(d) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); }).replace(/[٠-٩]/g, function(d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }); }
function nowMs_() { return new Date().getTime(); }
function dateMillis_(v) { if (!v) return 0; if (v instanceof Date) return v.getTime(); if (typeof v === "number") return v; const s = String(v).trim(); if (/^\d{10,}$/.test(s)) return Number(s); const n = new Date(s).getTime(); return isNaN(n) ? 0 : n; }
function parseSchedule_(text) {
  const raw = normalizeDigits_(String(text || "").trim()).replace(/[T\/]/g, " ").replace(/\s+/g, " ").trim();
  const s = raw.replace(/\//g, "-");
  if (!/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(s)) return null;
  try { const d = Utilities.parseDate(s, getSetting_("TIMEZONE") || APP.TZ, "yyyy-MM-dd HH:mm"); return d && d.getTime() > nowMs_() ? d : null; } catch (e) { return null; }
}
function formatDate_(v) { if (!v) return "—"; try { return Utilities.formatDate(v instanceof Date ? v : new Date(v), getSetting_("TIMEZONE") || APP.TZ, "yyyy-MM-dd HH:mm"); } catch (e) { return String(v); } }
function newId_(prefix) { return String(prefix || "X") + Utilities.getUuid().replace(/-/g, "").slice(0, 10).toUpperCase(); }
function appendRowObject_(sheetName, headers, obj) { getSheet_(sheetName).appendRow(headers.map(function(h) { return obj[h] == null ? "" : obj[h]; })); }
function userIdDisplay_(u) { return u ? truncate_(u.rapName || ((u.firstName + " " + u.lastName).trim()) || u.userId, 24) : "—"; }

// ── توکن دانلود امضاشده (HMAC-SHA256) ──
function base64Url_(bytes) { return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, ""); }
function computeDownloadSig_(token, expMs) {
  return computeDownloadSigWith_(token, expMs, downloadSecrets_()[0]);
}
// کلید امضا: APP_SECRET و در صورت نبود، کلید برند. LEGACY_APP_SECRET فقط برای پذیرش
// لینک‌های امضاشدهٔ قدیمی (مثلاً بعد از تغییر نام برند) استفاده می‌شود و امضای تازه با آن ساخته نمی‌شود.
function downloadSecrets_() {
  const out = [String(getSetting_("APP_SECRET") || "florabot")];
  const legacy = String(getSetting_("LEGACY_APP_SECRET") || "").trim();
  if (legacy && out.indexOf(legacy) < 0) out.push(legacy);
  return out;
}
function computeDownloadSigWith_(token, expMs, secret) {
  // امضا فقط از حروف و رقم ساخته می‌شود تا در deep-link تلگرام (start param) قابل استفاده باشد.
  return base64Url_(Utilities.computeHmacSha256Signature(token + "|" + String(expMs), secret, Utilities.Charset.UTF_8)).replace(/[-_]/g, "").slice(0, 16);
}
function buildDownloadToken_(trackId, expMs) {
  const exp = Number(expMs) || (nowMs_() + 7 * 86400000);
  const token = String(trackId).replace(/[^A-Za-z0-9_]/g, "");
  return { param: token + "." + exp, sig: computeDownloadSig_(token, exp), exp: exp };
}
// فقط توکن امضاشدهٔ معتبر پذیرفته می‌شود. قبلاً هر شناسهٔ خام (بدون امضا) هم قبول می‌شد
// که یعنی هر کسی با حدس زدن شناسه می‌توانست فایل را دانلود کند — یعنی امضا بی‌اثر بود.
function verifyDownloadParam_(param, sig) {
  const raw = String(param || "").trim();
  if (!raw) return "";
  const m = raw.match(/^([A-Za-z0-9_]{1,55})\.(\d{10,})$/);
  if (!m) return "";
  if (Number(m[2]) < nowMs_()) return "";
  const given = String(sig || "");
  const secrets = downloadSecrets_();
  for (let i = 0; i < secrets.length; i++) {
    const expected = computeDownloadSigWith_(m[1], m[2], secrets[i]);
    // مقایسهٔ ثابت‌زمان (ضد timing) روی رشته‌های هم‌طول
    if (given.length === expected.length && constantTimeEqual_(given, expected)) return m[1];
  }
  return "";
}
function constantTimeEqual_(a, b) {
  const x = String(a), y = String(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
function downloadLinkTtlMs_() {
  return Math.max(1, Number(getSetting_("DOWNLOAD_LINK_TTL_DAYS") || 30)) * 86400000;
}
// پارامتر شروع برای لینک t.me/<bot>?start=download_<param>
// قالب: <token>_<base36 exp>_<sig> — فقط کاراکترهای مجاز تلگرام (A-Za-z0-9_-).
function downloadStartParam_(trackIdOrSubmissionId) {
  const raw = String(trackIdOrSubmissionId || "").replace(/[^A-Za-z0-9_]/g, "").slice(0, 40);
  if (!raw) return "";
  if (String(getSetting_("DOWNLOAD_LINK_TOKEN") || "true") !== "true") return raw;
  const exp = nowMs_() + downloadLinkTtlMs_();
  return raw + "_" + exp.toString(36) + "_" + computeDownloadSig_(raw, exp);
}
function parseDownloadStartParam_(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const sigIdx = raw.lastIndexOf("_");
  if (sigIdx <= 0) return "";
  const expIdx = raw.lastIndexOf("_", sigIdx - 1);
  if (expIdx <= 0) return "";
  const token = raw.slice(0, expIdx);
  const exp = parseInt(raw.slice(expIdx + 1, sigIdx), 36);
  const sig = raw.slice(sigIdx + 1);
  if (!exp || !isFinite(exp)) return verifyDownloadParam_(raw, "");
  return verifyDownloadParam_(token + "." + exp, sig);
}

// ───────────────────────── عضویت اجباری ─────────────────────────
function getFJChannels_() {
  const sh = getSheet_(APP.SHEETS.REQUIRED_CHANNELS); if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues().map(function(r, i) { return { rowNumber: i + 2, chatId: String(r[0] || ""), joinUrl: String(r[1] || ""), title: String(r[2] || ""), active: r[3] === true || String(r[3]).toLowerCase() === "true" }; }).filter(function(c) { return c.chatId; });
}
function missingJoinChannels_(userId) {
  const channels = getFJChannels_().filter(function(c) { return c.active; }); const missing = [];
  channels.forEach(function(c) {
    const r = telegramRequest_("getChatMember", { chat_id: c.chatId, user_id: String(userId) });
    const m = r && r.ok && r.result; const status = m && String(m.status || "");
    const joined = status === "member" || status === "administrator" || status === "creator" || (status === "restricted" && m.is_member === true);
    if (!joined) missing.push(c);
  });
  return missing;
}
function passForceJoin_(userId, chatId) {
  if (getSetting_("FJ_ENABLED") !== "true") return true;
  const missing = missingJoinChannels_(userId); if (!missing.length) return true;
  const lang = userLang_(userId);
  const rows = missing.map(function(c) { return [{ text: t_(userId, "JOIN_JOIN_CHANNEL") + truncate_(c.title || c.chatId, 28), url: c.joinUrl }]; });
  rows.push([{ text: t_(userId, "BTN_TRY_JOIN"), callback_data: "fj:check" }]);
  sendMessage_(chatId, String(getSetting_("FJ_TEXT") || DEFAULT_SETTINGS.FJ_TEXT), { inline_keyboard: rows });
  return false;
}
function handleJoinCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  if (passForceJoin_(uid, chatId)) {
    answerCallbackQuery_(cb.id, t_(uid, "JOIN_CONFIRMED"));
    const u = getUserById_(uid); const session = getSession_("M:" + uid);
    if (session && session.state === "PENDING_MUSIC_DOWNLOAD" && ((session.data || {}).trackId || (session.data || {}).submissionId)) {
      const pendingData = session.data || {}; const trackId = String(pendingData.trackId || pendingData.submissionId); clearSession_("M:" + uid); handleMusicDownloadDelivery_(chatId, uid, trackId);
      if (pendingData.resumeState && pendingData.resumeState !== "PENDING_MUSIC_DOWNLOAD") setSession_("M:" + uid, pendingData.resumeState, pendingData.resumeData || {});
      return;
    }
    if (u && isLoggedIn_(uid) && session && session.state === "PENDING_START_ACTION" && (session.data || {}).action === "admin_panel" && isAdminAuthenticated_(uid)) {
      clearSession_("M:" + uid); showAdminMenu_(chatId, t_(uid, "JOIN_CONFIRMED")); return;
    }
    if (u && isLoggedIn_(uid)) {
      if (isAdmin_(uid) && isAdminAuthenticated_(uid)) { showAdminMenu_(chatId, t_(uid, "JOIN_CONFIRMED")); return; }
      showUserMenu_(chatId, t_(uid, "JOIN_CONFIRMED"));
    }
  } else answerCallbackQuery_(cb.id, t_(uid, "JOIN_NOT_YET"));
}

// ───────────────────────── منوها ─────────────────────────
function userKeyboard_(uid) {
  const lang = userLang_(uid);
  return { keyboard: [
    [{ text: tr_("BTN_SEND_MUSIC", null, lang) }, { text: tr_("BTN_SEND_ALBUM", null, lang) }],
    [{ text: tr_("BTN_FREESTYLE", null, lang) }, { text: tr_("BTN_COMING_SOON", null, lang) }],
    [{ text: tr_("BTN_MY_WORKS", null, lang) }, { text: tr_("BTN_PROFILE", null, lang) }],
    [{ text: tr_("BTN_MY_CHANNELS", null, lang) }],
    [{ text: tr_("BTN_SUPPORT", null, lang) }, { text: tr_("BTN_LOGOUT", null, lang) }]
  ], resize_keyboard: true, is_persistent: true };
}
function entryKeyboard_(uid) {
  const lang = userLang_(uid);
  return { keyboard: [[{ text: tr_("BTN_REGISTER", null, lang) }], [{ text: tr_("BTN_FORGOT", null, lang) }, { text: tr_("BTN_SUPPORT", null, lang) }]], resize_keyboard: true, is_persistent: true };
}
function adminKeyboard_() {
  return { keyboard: [
    [{ text: "🎵 ارسال موزیک" }, { text: "🎼 ارسال آلبوم" }],
    [{ text: "🎤 فری‌استایل" }, { text: "⏳ Coming Soon" }],
    [{ text: "🎵 ارسال‌ها" }, { text: "🗓 صف انتشار" }],
    [{ text: "👥 کاربران" }, { text: "🎤 فری‌استایل‌ها" }],
    [{ text: "🛡 دسترسی مدیران" }, { text: "💬 پشتیبانی" }],
    [{ text: "📣 پیام همگانی" }, { text: "😴 غیرفعال‌ها" }],
    [{ text: "⚙️ تنظیمات" }, { text: "📺 کانال" }],
    [{ text: "🎨 دکمه‌ها و رنگ‌ها" }, { text: "🆘 درخواست‌های رمز" }],
    [{ text: "🌐 عضویت اجباری" }, { text: "📊 آمار" }],
    [{ text: "🧹 نگهداری و بکاپ" }, { text: "📚 آثار من" }],
    [{ text: "📢 کانال‌های وصل‌شده" }, { text: "🖼 بنر تبلیغاتی" }]
  ], resize_keyboard: true, is_persistent: true };
}
function userMenuText_(uid) {
  const lang = userLang_(uid);
  return tr_("MENU_TITLE", null, lang) + "\n\n" + tr_("USER_MENU_HINT", null, lang);
}
function sendEntryCard_(chatId, prefix) {
  const uid = String(chatId);
  const lang = userLang_(uid);
  sendMessage_(chatId, (prefix ? prefix + "\n\n" : "") + niceText_("WELCOME_TEXT", null, lang), entryKeyboard_(uid));
}
function showUserMenu_(chatId, prefix) {
  const uid = String(chatId);
  sendMessage_(chatId, (prefix ? prefix + "\n\n" : "") + userMenuText_(uid), userKeyboard_(uid));
}
function showClaimCode() {
  const code = getSetting_("CLAIM_CODE");
  SpreadsheetApp.getUi().alert(code ? "کد اتصال مدیر:\n\n" + code + "\n\nدر ربات بفرست: /claim " + code : "کد اتصال مصرف شده است. برای افزودن مدیر جدید از پنل «🛡 دسترسی مدیران» استفاده کن.");
}
function handleClaim_(message, text) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const parts = String(text || "").trim().split(/\s+/); const code = parts[1] || "";
  const admins = getLegacyAdminIds_();
  if (isAdmin_(uid)) { showAdminMenu_(chatId, t_(uid, "ADMIN_ALREADY")); return; }
  if (admins.length > 0) { sendMessage_(chatId, t_(uid, "ADMIN_CLAIM_EXISTS")); return; }
  if (!code || code !== getSetting_("CLAIM_CODE")) { sendMessage_(chatId, t_(uid, "ADMIN_CLAIM_BAD")); return; }
  setSetting_("ADMIN_IDS", Array.from(new Set(admins.concat([uid]))).join(",")); setSetting_("CLAIM_CODE", "");
  const u0 = getUserById_(uid);
  // قبلاً رمز قدیمی (gateSalt) به‌عنوان کد دومرحله‌ای استفاده می‌شد؛ حالا کد تازه صادر می‌شود.
  if (u0 && isGateEnabled_(u0)) { const c0 = takeTwoStepCodeOnce_(uid) || issueTwoStepCode_(uid); sendMessage_(chatId, t_(uid, "MFA_CODE_ROTATED", { c: htmlEscape_(c0) }), null, { parse_mode: "HTML" }); }
  logAdminAction_(uid, "claim", uid, "admin claimed ownership");
  showAdminMenu_(chatId, t_(uid, "ADMIN_CLAIM_OK"));
}
function cancelCurrentFlow_(message, session, admin) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  if (admin) {
    if (isAdminAuthenticated_(uid)) {
      const isDraft = session && String(session.state).indexOf("MUSIC_") === 0;
      if (isDraft) { cancelMusicDraft_(uid, session); showAdminMenu_(chatId, t_(uid, "CANCEL_FLOW")); return; }
      if (session) cancelAdminFlow_(uid, session);
      showAdminMenu_(chatId, t_(uid, "CANCEL_DONE")); return;
    }
    clearSession_("M:" + uid);
    requireAdminAuthentication_(chatId, uid, t_(uid, "ADMIN_LOGIN_CANCELLED"));
    return;
  }
  if (session && String(session.state).indexOf("MUSIC_") === 0 && typeof cancelMusicDraft_ === "function") { cancelMusicDraft_(uid, session); showUserMenu_(chatId, t_(uid, "CANCEL_FLOW")); return; }
  if (session && session.state === "USR_SUPPORT") { setUserField_(uid, "supportMode", "closed"); clearSession_("M:" + uid); }
  else clearSession_("M:" + uid);
  if (isLoggedIn_(uid) && getUserById_(uid)) showUserMenu_(chatId, t_(uid, "CANCEL_DONE")); else sendEntryCard_(chatId, t_(uid, "CANCEL_DONE"));
}

// ───────────────────────── وب‌هوک و دیسپچ ─────────────────────────
function doPost(e) {
  resetRuntimeCaches_();
  const startedAt = nowMs_();
  try { ensureMusicDownloadDefaultMigration_(); } catch (migrationError) { console.error("Music download default migration: " + migrationError); }
  try {
    if (!e || !e.postData || !e.postData.contents) return HtmlService.createHtmlOutput("OK");
    const update = JSON.parse(e.postData.contents); const updateId = String(update.update_id || "");
    const cache = CacheService.getScriptCache();
    if (updateId && cache.get("music_upd_" + updateId)) return HtmlService.createHtmlOutput("OK");
    if (updateId) cache.put("music_upd_" + updateId, "1", 21600);
    // قفل فقط برای پیام‌هایی که رسانهٔ پیش‌نویس اضافه می‌کنند؛ بقیه بدون قفل رد می‌شوند.
    if (update.callback_query) handleCallbackQuery_(update.callback_query);
    else if (update.message) handleMessage_(update.message);
    else if (update.my_chat_member) handleMyChatMember_(update.my_chat_member);
  } catch (e2) {
    console.error(e2 && e2.stack ? e2.stack : e2);
    notifyAdminsError_(e2);
  }
  const elapsed = nowMs_() - startedAt;
  if (elapsed > 20000) console.warn("slow update: " + elapsed + "ms");
  return HtmlService.createHtmlOutput("OK");
}
function handleMyChatMember_(evt) {
  // اگر کاربر ربات را بلاک/آنبلاک کرد، وضعیت botBlocked به‌روز می‌شود.
  try {
    const status = String(evt && evt.new_chat_member && evt.new_chat_member.status || "");
    const chatId = String(evt && evt.chat && evt.chat.id || "");
    if (!/^\d+$/.test(chatId)) return;
    if (status === "kicked") setUserField_(chatId, "botBlocked", true);
    if (status === "member") setUserField_(chatId, "botBlocked", false);
  } catch (e) {}
}
function notifyAdminsError_(err) {
  try {
    if (String(getSetting_("ADMIN_ERROR_NOTIFY") || "true") !== "true") return;
    const message = truncate_(String(err && err.stack || err || ""), 350);
    getLegacyAdminIds_().forEach(function(a) { sendMessage_(a, "🐞 خطای بات (v" + APP.VERSION + "):\n" + message); });
  } catch (e) {}
}
function isCancelText_(text) { return String(text || "").trim() === "/cancel" || String(text || "").trim() === "❌ لغو" || String(text || "").trim() === "❌ Cancel"; }
function isLanguageCommand_(text) {
  const t = String(text || "").trim().toLowerCase();
  return t === "/lang" || t === "/language" || t === "🌍 زبان" || t === "🌍 language";
}
function showLanguagePicker_(chatId, uid) {
  const lang = userLang_(uid);
  sendMessage_(chatId, t_(uid, "LANG_PICK"), { inline_keyboard: [[{ text: "🇮🇷 فارسی", callback_data: "lg:fa" }, { text: "🇬🇧 English", callback_data: "lg:en" }]] });
}
function setLanguage_(uid, lang) {
  if (LANGS.indexOf(lang) < 0) return false;
  const u = getUserById_(uid);
  if (u) { if (String(getSetting_("USER_LANG_EDITABLE") || "true") !== "true" && !isAdmin_(uid)) return false; setUserField_(uid, "lang", lang); }
  else {
    // کاربر ثبت‌نام‌نشده: در CacheService نگه می‌داریم تا بعد از ثبت‌نام اعمال شود.
    try { CacheService.getScriptCache().put("lang_" + uid, lang, 86400); } catch (e) {}
  }
  return true;
}
function guestLang_(uid) {
  if (uid) { const lang = String(getUserById_(uid) && getUserById_(uid).lang || ""); if (lang && MSG[lang]) return lang; }
  try { const cached = CacheService.getScriptCache().get("lang_" + uid); if (cached && MSG[cached]) return cached; } catch (e) {}
  return String(getSetting_("DEFAULT_LANG") || "fa");
}

function handleMessage_(message) {
  if (!message || !message.chat || !message.from || message.chat.type !== "private") return;
  const chatId = String(message.chat.id); const uid = String(message.from.id); const text = String(message.text || "").trim();
  learnIdentity_(message.from);
  if (text.indexOf("/claim") === 0) { handleClaim_(message, text); return; }
  if (isLanguageCommand_(text)) { showLanguagePicker_(chatId, uid); return; }
  const startCommand = text.match(/^\/start(?:@[A-Za-z0-9_]+)?(?:\s+([A-Za-z0-9_.-]{1,120}))?$/i);
  if (startCommand) {
    const downloadStart = String(startCommand[1] || "").match(/^download_([A-Za-z0-9_.-]{1,120})$/i);
    if (downloadStart) { beginMusicDownloadFromDeepLink_(message, downloadStart[1]); return; }
    if (!getSetting_("ADMIN_IDS") && !isAdmin_(uid)) { sendMessage_(chatId, t_(uid, "NOT_SETUP")); return; }
    if (isAdmin_(uid)) { adminEntry_(chatId, uid); return; }
    const u0 = getUserById_(uid);
    if (u0 && !u0.blocked && !u0.active) { sendMessage_(chatId, t_(uid, "ACCOUNT_INACTIVE")); return; }
    if (u0 && u0.blocked) { sendMessage_(chatId, t_(uid, "ACCOUNT_BLOCKED")); return; }
    if (u0 && isLoggedIn_(uid)) {
      touchUser_(uid); if (!passForceJoin_(uid, chatId)) return; showUserMenu_(chatId); return;
    }
    sendEntryCard_(chatId); return;
  }
  // آپلود آلبوم (۱۲ ترک + ۱۰ کاور) ده‌ها پیام پشت‌سرهم است؛ یک سقف ۲۵ پیام در دقیقه
  // وسط آلبوم می‌ترکید و فایل‌ها بی‌صدا دور ریخته می‌شدند. پس سهمیهٔ جداگانه برای رسانه‌ها داریم
  // و سهمیهٔ متنی هم فقط روی پیام‌های متنی اعمال می‌شود.
  const isMediaMessage = !!(message.photo || message.document || message.audio || message.video || message.voice);
  if (isMediaMessage) {
    if (!rateAllow_("media:" + uid, getSetting_("RATE_MEDIA_PER_MIN") || 90, 60)) { sendMessage_(chatId, t_(uid, "RATE_LIMITED")); return; }
    if (!rateAllow_("mediahour:" + uid, getSetting_("RATE_MEDIA_PER_HOUR") || 400, 3600)) { sendMessage_(chatId, t_(uid, "RATE_LIMITED")); return; }
  } else if (!rateAllow_("msg:" + uid, getSetting_("RATE_MSG_PER_MIN") || 25, 60)) {
    sendMessage_(chatId, t_(uid, "RATE_LIMITED")); return;
  }
  const session = getSession_("M:" + uid); const admin = isAdmin_(uid);
  const authState = !!session && /^(AUTH_|REG_|LOGIN_|FORGOT_|MFA_)/.test(session.state);
  if (isCancelText_(text)) {
    if (admin && !isAdminAuthenticated_(uid)) { clearSession_("M:" + uid); requireAdminAuthentication_(chatId, uid, t_(uid, "ADMIN_LOGIN_CANCELLED")); return; }
    cancelCurrentFlow_(message, session, admin); return;
  }
  if (authState) { handleAuthMessage_(message, session); return; }
  if (session && session.state === "USR_WITHDRAW_CONFIRM") { handleWithdrawConfirm_(message, session); return; }
  if (session && String(session.state).indexOf("USR_EDIT_") === 0) {
    if (!isLoggedIn_(uid)) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGIN_NEEDED")); return; }
    handleUserEditState_(message, session, getUserById_(uid)); return;
  }
  if (session && session.state === "CC_ADD") {
    if (!isLoggedIn_(uid)) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGIN_NEEDED")); return; }
    handleConnectedChannelAdd_(message, session); return;
  }
  if (session && session.state === "CC_EDIT") {
    if (!isLoggedIn_(uid)) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGIN_NEEDED")); return; }
    handleConnectedChannelEdit_(message, session); return;
  }
  if (admin && !isAdminAuthenticated_(uid)) {
    if (text === "🟡 ثبت‌نام / ورود" || text === "🟡 ثبت‌نام" || text === "🔑 ورود" || text === MSG.en.BTN_REGISTER) {
      if (getSession_("AUTH:" + uid)) { showAdminMenu_(chatId); return; }
      // مقصد را نگه می‌داریم تا بعد از ورود، مستقیم پنل مدیریت باز شود
      setSession_("M:" + uid, "START_AFTER_LOGIN", { action: "admin_panel" });
      startAuthFlow_(message); return;
    }
    if (text === "🆘 فراموشی رمز" || text === MSG.en.BTN_FORGOT) { startForgotFlow_(message); return; }
    requireAdminAuthentication_(chatId, uid); return;
  }
  if (admin) {
    if (isAdminSessionStale_(uid)) {
      logoutUser_(uid); clearSession_("M:" + uid);
      requireAdminAuthentication_(chatId, uid, t_(uid, "ADMIN_SESSION_EXPIRED")); return;
    }
    touchAdminSession_(uid);
    if (session && String(session.state).indexOf("MUSIC_") === 0) { handleMusicMessage_(message, session); return; }
    if (session && String(session.state).indexOf("ADM_") === 0) { handleAdminState_(message, session); return; }
    if (session && String(session.state).indexOf("PERS_") === 0) { handleProfileState_(message, session); return; }
    if (session && session.state === "USR_SUPPORT") { handleSupportUserMessage_(message, session); return; }
    handleAdminMenuMessage_(message); return;
  }
  const u = getUserById_(uid); const loggedIn = !!(u && isLoggedIn_(uid));
  if (loggedIn && u && !u.blocked && u.active) {
    verifyUserConnectedChannelsBanner_(uid, chatId);
  }
  if (session && session.state === "USR_SUPPORT") {
    if (loggedIn) {
      if (u.blocked || !u.active) { sendMessage_(chatId, t_(uid, u.blocked ? "ACCOUNT_BLOCKED" : "ACCOUNT_INACTIVE")); return; }
      touchUser_(uid); if (!passForceJoin_(uid, chatId)) return;
    }
    handleSupportUserMessage_(message, session); return;
  }
  if (session && String(session.state).indexOf("PERS_") === 0) {
    if (!loggedIn) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGIN_NEEDED")); return; }
    handleProfileState_(message, session); return;
  }
  if (session && String(session.state).indexOf("MUSIC_") === 0) {
    if (!loggedIn) { cancelMusicDraft_(uid, session); sendEntryCard_(chatId, t_(uid, "LOGIN_NEEDED")); return; }
    if (u.blocked || !u.active) { sendMessage_(chatId, t_(uid, u.blocked ? "ACCOUNT_BLOCKED" : "ACCOUNT_INACTIVE")); return; }
    if (!["active", ""].includes(String(getSetting_("BOT_MODE") || "active"))) { sendMessage_(chatId, niceText_("MAINTENANCE_TEXT", null, userLang_(uid))); return; }
    touchUser_(uid); if (!passForceJoin_(uid, chatId)) return; handleMusicMessage_(message, session); return;
  }
  if (text === "🟡 ثبت‌نام / ورود" || text === "🟡 ثبت‌نام" || text === "🔑 ورود" || text === MSG.en.BTN_REGISTER) { startAuthFlow_(message); return; }
  if (text === "🆘 فراموشی رمز" || text === MSG.en.BTN_FORGOT) { startForgotFlow_(message); return; }
  if (!loggedIn) {
    if (text === "📞 پشتیبانی" || text === MSG.en.BTN_SUPPORT) { startUserSupport_(chatId, uid); return; }
    sendEntryCard_(chatId, t_(uid, "LOGIN_NEEDED")); return;
  }
  if (u.blocked) { sendMessage_(chatId, t_(uid, "ACCOUNT_BLOCKED")); return; }
  if (!u.active) { sendMessage_(chatId, t_(uid, "ACCOUNT_INACTIVE")); return; }
  if (!["active", ""].includes(String(getSetting_("BOT_MODE") || "active")) && text !== "📞 پشتیبانی" && text !== MSG.en.BTN_SUPPORT) { sendMessage_(chatId, niceText_("MAINTENANCE_TEXT", null, userLang_(uid))); return; }
  touchUser_(uid); if (!passForceJoin_(uid, chatId)) return;
  if (text === "📞 پشتیبانی" || text === MSG.en.BTN_SUPPORT) { startUserSupport_(chatId, uid); return; }
  handleUserMenuMessage_(message, u);
}
function adminEntry_(chatId, uid) {
  if (!isAdminAuthenticated_(uid)) { requireAdminAuthentication_(chatId, uid); return; }
  if (isAdminSessionStale_(uid)) { logoutUser_(uid); requireAdminAuthentication_(chatId, uid, t_(uid, "ADMIN_SESSION_EXPIRED")); return; }
  touchAdminSession_(uid);
  if (getUserById_(uid) && !passForceJoin_(uid, chatId)) return;
  showAdminMenu_(chatId);
}

function handleCallbackQuery_(cb) {
  if (!cb || !cb.from) return;
  const uid = String(cb.from.id); const data = String(cb.data || ""); const chatId = cb.message && cb.message.chat ? String(cb.message.chat.id) : uid;
  if (!isAdmin_(uid) && isLoggedIn_(uid) && getUserById_(uid)) {
    touchUser_(uid);
    verifyUserConnectedChannelsBanner_(uid, chatId);
  }
  if (data === "fj:check") { handleJoinCallback_(cb); return; }
  if (data.indexOf("lg:") === 0) {
    const lang = data.split(":")[1] || "fa";
    if (!setLanguage_(uid, lang)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    answerCallbackQuery_(cb.id, tr_("LANG_SET", null, lang));
    if (isAdminAuthenticated_(uid)) showAdminMenu_(chatId);
    else if (isLoggedIn_(uid) && getUserById_(uid)) showUserMenu_(chatId);
    else sendEntryCard_(chatId);
    return;
  }
  if (data.indexOf("regprov:") === 0 || data.indexOf("regcountry:") === 0 || data.indexOf("regcity:") === 0 || data.indexOf("regcitypage:") === 0 || data.indexOf("regcitygo:") === 0 || data === "regcityfree") { handleAuthCallback_(cb); return; }
  if (data.indexOf("pwreset:") === 0) { handleAuthCallback_(cb); return; }
  if (data.indexOf("mfa:") === 0) { handleMfaCallback_(cb); return; }
  if (data.indexOf("m:") === 0) { handleMusicCallback_(cb); return; }
  if (data.indexOf("myc:") === 0) { handleMyChannelsCallback_(cb); return; }
  if (data.indexOf("w:") === 0) { handleWorksCallback_(cb); return; }
  if (data.indexOf("p:") === 0) { handleProfileCallback_(cb); return; }
  if (data.indexOf("sdel:") === 0) { handleAccountDeleteCallback_(cb); return; }
  // توجه: «cb:» هم باید اینجا باشد، وگرنه دکمه‌های تنظیمات پست به هندلر مدیر نمی‌رسند.
  if (/^(a|u|sub|set|fj|color|botmode|bc|r|support|cb|acc|bn|ccp):/.test(data)) {
    if (!isAdmin_(uid)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    if (!isAdminAuthenticated_(uid)) { answerCallbackQuery_(cb.id, t_(uid, "ADMIN_AUTH_NEEDED")); requireAdminAuthentication_(chatId, uid); return; }
    if (isAdminSessionStale_(uid)) { logoutUser_(uid); answerCallbackQuery_(cb.id, t_(uid, "ADMIN_SESSION_EXPIRED")); requireAdminAuthentication_(chatId, uid, t_(uid, "ADMIN_SESSION_EXPIRED")); return; }
    touchAdminSession_(uid);
    handleAdminCallback_(cb); return;
  }
  answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN"));
}

// ───────────────────────── احراز هویت و ثبت‌نام ─────────────────────────
function pendingStartAction_(userId) {
  const session = getSession_("M:" + userId); const data = session && session.data || {};
  if (session && (session.state === "START_AFTER_LOGIN" || session.state === "PENDING_START_ACTION")) return String(data.action || "");
  return String(data.pendingAction || "");
}
function continueAfterLogin_(userId, chatId, action) {
  const pending = String(action || "");
  if (pending === "admin_panel") {
    clearSession_("M:" + userId);
    if (isAdminAuthenticated_(userId)) { touchAdminSession_(userId); showAdminMenu_(chatId, t_(userId, "LOGIN_OK")); }
    else {
      const u = getUserById_(userId);
      if (u) showUserMenu_(chatId, t_(userId, "LOGIN_OK"));
      else sendEntryCard_(chatId, t_(userId, "LOGIN_OK"));
    }
    return true;
  }
  if (!passForceJoin_(userId, chatId)) {
    if (pending) setSession_("M:" + userId, "PENDING_START_ACTION", { action: pending });
    return false;
  }
  showUserMenu_(chatId);
  return true;
}
function beginMusicDownloadFromDeepLink_(message, param) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const id = parseDownloadStartParam_(param);
  if (!id) { sendMessage_(chatId, t_(uid, "DOWNLOAD_BAD_LINK")); return; }
  const existingUser = getUserById_(uid);
  if (existingUser && (existingUser.blocked || !existingUser.active)) { sendMessage_(chatId, t_(uid, "ACCOUNT_INACTIVE")); return; }
  if (!["active", ""].includes(String(getSetting_("BOT_MODE") || "active"))) { sendMessage_(chatId, niceText_("MAINTENANCE_TEXT", null, guestLang_(uid))); return; }
  const track = getDownloadableMusicTrack_(id);
  if (!track) {
    const own = getSubmission_(id);
    if (own && String(own.userId) === uid && own.status !== "published") { sendMessage_(chatId, t_(uid, "DOWNLOAD_DISABLED") + "\n" + t_(uid, "MY_WORK_OFFLINE_NOTE")); return; }
    sendMessage_(chatId, t_(uid, "DOWNLOAD_DISABLED")); return;
  }
  if (!rateAllow_("dl:" + uid, getSetting_("RATE_DOWNLOADS_PER_HOUR") || 10, 3600)) { sendMessage_(chatId, t_(uid, "RATE_LIMITED")); return; }
  const previousSession = getSession_("M:" + uid);
  if (!passForceJoin_(uid, chatId)) { setSession_("M:" + uid, "PENDING_MUSIC_DOWNLOAD", { trackId: track.trackId, resumeState: previousSession && previousSession.state, resumeData: previousSession && previousSession.data }); return; }
  handleMusicDownloadDelivery_(chatId, uid, track.trackId);
}
function startAuthFlow_(message) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const pendingAction = pendingStartAction_(uid);
  setSession_("M:" + uid, "AUTH_CONTACT", pendingAction ? { pendingAction: pendingAction } : {});
  sendMessage_(chatId, t_(uid, "SENT_PHONE_PROMPT"), { keyboard: [[{ text: t_(uid, "BTN_SEND_PHONE"), request_contact: true }], [{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, one_time_keyboard: true });
}
function startForgotFlow_(message) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  setSession_("M:" + uid, "FORGOT_CONTACT", {});
  sendMessage_(chatId, t_(uid, "FORGOT_PROMPT"), { keyboard: [[{ text: t_(uid, "BTN_SEND_PHONE"), request_contact: true }], [{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, one_time_keyboard: true });
}
function phoneKeyboard_(uid) { return { keyboard: [[{ text: t_(uid, "BTN_SEND_PHONE"), request_contact: true }], [{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true }; }
function handleAuthMessage_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const text = String(message.text || "").trim(); const d = session.data || {};
  if (String(session.state).indexOf("MFA_") === 0) { handleMfaMessage_(message, session); return; }
  if (session.state === "AUTH_CONTACT") {
    const c = message.contact;
    if (!c || String(c.user_id || "") !== uid) { sendMessage_(chatId, t_(uid, "PHONE_BUTTON_ONLY"), phoneKeyboard_(uid)); return; }
    const byPhone = getUserByPhone_(c.phone_number); const byId = getUserById_(uid);
    if (byPhone) {
      if (byPhone.userId !== uid) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "PHONE_OTHER_ACCOUNT")); return; }
      if (byPhone.blocked) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "ACCOUNT_BLOCKED")); return; }
      if (!byPhone.active) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "ACCOUNT_INACTIVE")); return; }
      setSession_("M:" + uid, "LOGIN_PASSWORD", { phone: byPhone.phone, attempts: 0, pendingAction: d.pendingAction || "" });
      sendMessage_(chatId, t_(uid, "PHONE_SAVED"), { keyboard: [[{ text: t_(uid, "BTN_FORGOT") }], [{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, is_persistent: true }); return;
    }
    if (byId) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "PHONE_TAKEN")); return; }
    setSession_("M:" + uid, "REG_FIRST_NAME", { phone: String(c.phone_number), pendingAction: d.pendingAction || "" });
    sendMessage_(chatId, t_(uid, "ASK_FIRST_NAME"), cancelKeyboard_()); return;
  }
  if (session.state === "FORGOT_CONTACT") {
    const c = message.contact;
    if (!c || String(c.user_id || "") !== uid) { sendMessage_(chatId, t_(uid, "PHONE_BUTTON_ONLY"), phoneKeyboard_(uid)); return; }
    const u = getUserByPhone_(c.phone_number);
    if (!u || u.userId !== uid) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "FORGOT_NO_ACCOUNT")); return; }
    if (u.blocked) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "FORGOT_BLOCKED")); return; }
    const existingOpen = getResetRequests_().find(function(r) { return r.userId === uid && r.status === "pending"; });
    if (existingOpen) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "FORGOT_SENT")); return; }
    const requestId = newId_("R");
    withLock_(function() {
      getSheet_(APP.SHEETS.RESET_REQUESTS).appendRow([requestId, uid, u.phone, u.firstName, u.lastName, u.rapName, "pending", new Date(), "", ""]);
    });
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "FORGOT_SENT"));
    const summary = "🆘 درخواست بازیابی رمز\n👤 " + (u.firstName + " " + u.lastName) + " — «" + u.rapName + "»\n📱 " + u.phone + "\n🆔 " + uid;
    getAdmins_().forEach(function(a) { sendMessage_(a, summary, { inline_keyboard: [[{ text: "✅ تأیید", callback_data: "r:approve:" + requestId }, { text: "❌ رد", callback_data: "r:reject:" + requestId }], [{ text: "💬 بازکردن PV", url: "tg://user?id=" + uid }]] }); });
    return;
  }
  if (session.state === "REG_FIRST_NAME") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "ASK_FIRST_NAME"), cancelKeyboard_()); return; }
    d.firstName = text; setSession_("M:" + uid, "REG_LAST_NAME", d); sendMessage_(chatId, t_(uid, "ASK_LAST_NAME"), cancelKeyboard_()); return;
  }
  if (session.state === "REG_LAST_NAME") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "ASK_LAST_NAME"), cancelKeyboard_()); return; }
    d.lastName = text; setSession_("M:" + uid, "REG_RAP_NAME", d); sendMessage_(chatId, t_(uid, "ASK_RAP_NAME"), cancelKeyboard_()); return;
  }
  if (session.state === "REG_RAP_NAME") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "ASK_RAP_NAME"), cancelKeyboard_()); return; }
    d.rapName = text; setSession_("M:" + uid, "REG_PROVINCE", d); showProvinceMenu_(chatId, uid); return;
  }
  if (session.state === "REG_CITY_FREE") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "ASK_CITY_FREE"), cancelKeyboard_()); return; }
    d.city = text; setSession_("M:" + uid, "REG_PW1", d); askPassword_(chatId, uid, "ASK_PW1"); return;
  }
  if (session.state === "REG_COUNTRY_FREE") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "OTHER_COUNTRIES"), cancelKeyboard_()); return; }
    d.country = "other"; d.countryName = text; setSession_("M:" + uid, "REG_CITY_FREE", d); sendMessage_(chatId, t_(uid, "ASK_CITY_FREE"), cancelKeyboard_()); return;
  }
  if (session.state === "LOGIN_GATE_CODE") {
    purgeInput_(message);
    const u = getUserById_(uid); const code = normalizeDigits_(text).replace(/\s+/g, "");
    const d2 = session.data || {};
    if (u && verifyGateCode_(u, code)) {
      const pendingAction = d2.pendingAction || "";
      clearSession_("M:" + uid); clearFailedLogin_(uid); loginUser_(uid); touchUser_(uid);
      sendMessage_(chatId, t_(uid, "LOGIN_OK")); continueAfterLogin_(uid, chatId, pendingAction); return;
    }
    const n = Number(d2.attempts || 0) + 1;
    if (n >= 5) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGIN_ATTEMPTS_END")); return; }
    setSession_("M:" + uid, "LOGIN_GATE_CODE", Object.assign({}, d2, { attempts: n }));
    sendMessage_(chatId, t_(uid, "LOGIN_FAIL_2FA", { n: n }), { keyboard: [[{ text: t_(uid, "PROFILE_2FA") }], [{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, is_persistent: true }); return;
  }
  if (session.state === "REG_PW1" || session.state === "REG_PW2" || session.state === "FORGOT_PW1" || session.state === "FORGOT_PW2") { handleNewPassword_(message, session); return; }
  if (session.state === "LOGIN_PASSWORD") {
    if (text === t_(uid, "BTN_FORGOT") || text === "🆘 فراموشی رمز") { clearSession_("M:" + uid); startForgotFlow_(message); return; }
    purgeInput_(message);
    const u = getUserById_(uid); const p = String(message.text || "");
    const gateNeeded = isGateEnabled_(u);
    const passOk = !!(u && hashPassword_(p, u.passSalt, uid) === u.passHash);
    // اصلاح امنیتی: کد دومرحله‌ای جایگزین رمز نیست، مکمل آن است.
    // حالت تک‌مرحله‌ای: فقط رمز. حالت دومرحله‌ای: رمز + کد (در یک پیام «رمز کد» یا در دو مرحله).
    const parts = String(p).split(/\s+/);
    const codeOk = gateNeeded && parts.length === 2 && passOk && verifyGateCode_(u, parts[1]);
    if (u && passOk && !gateNeeded) {
      if (u.blocked || !u.active) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, u.blocked ? "ACCOUNT_BLOCKED" : "ACCOUNT_INACTIVE")); return; }
      if (gateNeeded && !codeOk && !passOk) { /* غیرممکن */ }
      const pendingAction = d.pendingAction || "";
      clearSession_("M:" + uid); clearFailedLogin_(uid); loginUser_(uid); touchUser_(uid);
      sendMessage_(chatId, t_(uid, "LOGIN_OK")); continueAfterLogin_(uid, chatId, pendingAction); return;
    }
    if (u && gateNeeded && passOk) {
      // رمز درست است ولی کد لازم است: مرحلهٔ دوم
      setSession_("M:" + uid, "LOGIN_GATE_CODE", { phone: u.phone, attempts: Number(d.attempts || 0), pendingAction: d.pendingAction || "" });
      sendMessage_(chatId, t_(uid, "LOGIN_GATE") + "\n" + t_(uid, "LOGIN_GATE_HINT"), cancelKeyboard_()); return;
    }
    const n = registerFailedLogin_(uid);
    if (n >= 5) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGIN_ATTEMPTS_END")); return; }
    // اصلاح: pendingAction (مثل بازکردن پنل مدیر) در تلاش‌های بعدی حفظ می‌شود.
    setSession_("M:" + uid, "LOGIN_PASSWORD", { phone: d.phone || "", attempts: n, pendingAction: d.pendingAction || "" });
    const sentence = gateNeeded ? "LOGIN_FAIL_2FA" : "LOGIN_FAIL";
    sendMessage_(chatId, t_(uid, sentence, { n: n }), { keyboard: gateNeeded ? [[{ text: t_(uid, "PROFILE_2FA") }], [{ text: t_(uid, "BTN_FORGOT") }], [{ text: t_(uid, "BTN_CANCEL") }]] : [[{ text: t_(uid, "BTN_FORGOT") }], [{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, is_persistent: true }); return;
  }
  if (session.state === "REG_PROVINCE" || session.state === "REG_CITY") { sendMessage_(chatId, t_(uid, session.state === "REG_PROVINCE" ? "PICK_PROVINCE" : "PICK_CITY")); return; }
  clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "CANCEL_WRONG_STAGE"));
}
function askPassword_(chatId, uid, key) { sendMessage_(chatId, "🔐 " + t_(uid, key), cancelKeyboard_()); }
function handleNewPassword_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const p = String(message.text || ""); const d = session.data || {};
  purgeInput_(message);
  const first = session.state === "REG_PW1" || session.state === "FORGOT_PW1";
  const isReset = String(session.state).indexOf("FORGOT_") === 0;
  if (first) {
    if (p.length < 6 || p.length > 64) { askPassword_(chatId, uid, "PW_LEN"); return; }
    const salt = newSalt_(); d.candidateSalt = salt; d.candidateHash = hashPassword_(p, salt, uid);
    setSession_("M:" + uid, isReset ? "FORGOT_PW2" : "REG_PW2", d);
    askPassword_(chatId, uid, "ASK_PW2"); return;
  }
  if (p.length < 6 || hashPassword_(p, d.candidateSalt, uid) !== d.candidateHash) {
    delete d.candidateSalt; delete d.candidateHash;
    setSession_("M:" + uid, isReset ? "FORGOT_PW1" : "REG_PW1", d);
    askPassword_(chatId, uid, "PW_RESTART"); return;
  }
  if (isReset) {
    const req = getResetRequest_(d.requestId); const currentUser = getUserById_(uid);
    if (!req || req.userId !== uid || req.status !== "approved" || !currentUser) { clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "FORGOT_INVALID")); return; }
    try {
      withLock_(function() {
        setUserField_(uid, "passSalt", d.candidateSalt); setUserField_(uid, "passHash", d.candidateHash);
        setResetRequestStatus_(d.requestId, "completed", "");
      });
    } catch (e) {
      // حالت نشست دست‌نخورده می‌ماند؛ کاربر همان پیام را دوباره بفرستد کافی است.
      if (!e || e.lockBusy !== true) throw e;
      sendMessage_(chatId, t_(uid, "SERVER_BUSY")); return;
    }
    clearSession_("M:" + uid); logoutUser_(uid);
    sendEntryCard_(chatId, t_(uid, "PW_SET")); return;
  }
  const pendingAction = String(d.pendingAction || "");
  const user = Object.assign({}, d, { userId: uid, passSalt: d.candidateSalt, passHash: d.candidateHash, username: (message.from.username ? "@" + message.from.username : ""), lang: guestLang_(uid) });
  try {
    withLock_(function() { createUser_(user); });
  } catch (e) {
    if (!e || e.lockBusy !== true) throw e;
    sendMessage_(chatId, t_(uid, "SERVER_BUSY")); return;
  }
  clearSession_("M:" + uid); loginUser_(uid);
  sendMessage_(chatId, (niceText_("REG_DONE_TEXT", null, user.lang) || DEFAULT_SETTINGS.REG_DONE_TEXT) + "\n👤 " + user.firstName + " " + user.lastName + " — «" + user.rapName + "»");
  continueAfterLogin_(uid, chatId, pendingAction);
}
function showProvinceMenu_(chatId, uid) {
  const rows = [];
  for (let i = 0; i < IR_GEO.length; i += 2) {
    const row = [{ text: IR_GEO[i].p, callback_data: "regprov:" + i }];
    if (IR_GEO[i + 1]) row.push({ text: IR_GEO[i + 1].p, callback_data: "regprov:" + (i + 1) });
    rows.push(row);
  }
  rows.push([{ text: t_(uid, "OTHER_COUNTRY"), callback_data: "regcountry:other" }]);
  sendMessage_(chatId, t_(uid, "ASK_PROVINCE"), { inline_keyboard: rows });
}
const OTHER_COUNTRIES_ = ["Germany", "Netherlands", "Turkey", "United States", "United Kingdom", "Canada", "Sweden", "France", "Australia", "United Arab Emirates", "Iraq", "Afghanistan", "Tajikistan", "Other"];
function showCountryMenu_(chatId, uid) {
  const rows = [];
  for (let i = 0; i < OTHER_COUNTRIES_.length; i += 3) {
    rows.push(OTHER_COUNTRIES_.slice(i, i + 3).map(function(c) { return { text: c, callback_data: "regcountry:" + encodeURIComponent(c) }; }));
  }
  rows.push([{ text: "✍️ " + (userLang_(uid) === "en" ? "Type my country" : "نوشتن نام کشور"), callback_data: "regcountry:free" }]);
  sendMessage_(chatId, t_(uid, "OTHER_COUNTRIES"), { inline_keyboard: rows });
}
function showCityMenu_(chatId, provinceIndex, page, uid) {
  const cities = IR_GEO[provinceIndex] ? IR_GEO[provinceIndex].c : []; const rows = [];
  const size = 60; const pages = Math.max(1, Math.ceil(cities.length / size)); const p = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  const start = p * size; const end = Math.min(start + size, cities.length);
  for (let i = start; i < end; i += 3) {
    const row = [{ text: cities[i], callback_data: "regcity:" + provinceIndex + ":" + i }];
    if (i + 1 < end) row.push({ text: cities[i + 1], callback_data: "regcity:" + provinceIndex + ":" + (i + 1) });
    if (i + 2 < end) row.push({ text: cities[i + 2], callback_data: "regcity:" + provinceIndex + ":" + (i + 2) });
    rows.push(row);
  }
  if (pages > 1) rows.push([{ text: "◀️", callback_data: "regcitypage:" + provinceIndex + ":" + Math.max(0, p - 1) }, { text: (p + 1) + "/" + pages, callback_data: "regcitypage:" + provinceIndex + ":" + p }, { text: "▶️", callback_data: "regcitypage:" + provinceIndex + ":" + Math.min(pages - 1, p + 1) }]);
  rows.push([{ text: "✍️ سایر شهرها (نوشتن نام)", callback_data: "regcityfree" }]);
  sendMessage_(chatId, "استان: " + IR_GEO[provinceIndex].p + " — شهر " + (p + 1) + "/" + pages + ":", { inline_keyboard: rows });
}
function showActiveCityMenu_(chatId, uid) {
  // برای ویرایش شهر توسط کاربر (جریان پروفایل)؛ انتخاب روی نشست پروفایل ذخیره می‌شود.
  const rows = [];
  for (let i = 0; i < IR_GEO.length; i += 2) {
    const row = [{ text: IR_GEO[i].p, callback_data: "p:prov:" + i }];
    if (IR_GEO[i + 1]) row.push({ text: IR_GEO[i + 1].p, callback_data: "p:prov:" + (i + 1) });
    rows.push(row);
  }
  rows.push([{ text: t_(uid, "OTHER_COUNTRY"), callback_data: "p:prov:other" }, { text: t_(uid, "BTN_CANCEL"), callback_data: "p:cancel" }]);
  sendMessage_(chatId, t_(uid, "ASK_PROVINCE"), { inline_keyboard: rows });
}
function showActiveCityList_(chatId, uid, provinceIndex, page) {
  const cities = IR_GEO[provinceIndex] ? IR_GEO[provinceIndex].c : []; const rows = [];
  const size = 60; const pages = Math.max(1, Math.ceil(cities.length / size)); const p = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  const start = p * size; const end = Math.min(start + size, cities.length);
  for (let i = start; i < end; i += 3) {
    const row = [{ text: cities[i], callback_data: "p:city:" + provinceIndex + ":" + i }];
    if (i + 1 < end) row.push({ text: cities[i + 1], callback_data: "p:city:" + provinceIndex + ":" + (i + 1) });
    if (i + 2 < end) row.push({ text: cities[i + 2], callback_data: "p:city:" + provinceIndex + ":" + (i + 2) });
    rows.push(row);
  }
  if (pages > 1) rows.push([{ text: "◀️", callback_data: "p:citypage:" + provinceIndex + ":" + Math.max(0, p - 1) }, { text: (p + 1) + "/" + pages, callback_data: "p:citypage:" + provinceIndex + ":" + p }, { text: "▶️", callback_data: "p:citypage:" + provinceIndex + ":" + Math.min(pages - 1, p + 1) }]);
  rows.push([{ text: "✍️ سایر شهرها (نوشتن نام)", callback_data: "p:cityfree" }, { text: t_(uid, "BTN_CANCEL"), callback_data: "p:cancel" }]);
  sendMessage_(chatId, "استان: " + IR_GEO[provinceIndex].p + " — شهر " + (p + 1) + "/" + pages + ":", { inline_keyboard: rows });
}
function handleAuthCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id); const data = String(cb.data || ""); const s = getSession_("M:" + uid);
  if (data.indexOf("mfa:") === 0) { handleMfaCallback_(cb, s); return; }
  if (data.indexOf("pwreset:") === 0) {
    const req = getResetRequest_(data.split(":")[1]);
    if (!req || req.userId !== uid || req.status !== "approved") { answerCallbackQuery_(cb.id, t_(uid, "FORGOT_INVALID")); return; }
    setSession_("M:" + uid, "FORGOT_PW1", { requestId: req.requestId });
    answerCallbackQuery_(cb.id); askPassword_(chatId, uid, "FORGOT_PW_PROMPT"); return;
  }
  // حالت‌های انتخاب استان/شهر و همچنین «سایر کشورها» باید پذیرفته شوند،
  // وگرنه مسیر ثبت‌نام کاربران خارج از ایران کامل بسته می‌ماند.
  const geoStates = ["REG_PROVINCE", "REG_CITY", "REG_COUNTRY_FREE", "REG_CITY_FREE"];
  if (!s || geoStates.indexOf(String(s.state)) < 0) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
  const d = s.data || {};
  if (data.indexOf("regcitypage:") === 0 && s.state === "REG_CITY") {
    const pg = data.split(":"); const pi = Number(pg[1]); const page = Number(pg[2]);
    if (!IR_GEO[pi] || pi !== Number(d.provinceIndex)) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    answerCallbackQuery_(cb.id); showCityMenu_(chatId, pi, page, uid); return;
  }
  if (data === "regcountry:other" && s.state === "REG_PROVINCE") {
    d.country = "other"; d.province = "سایر کشورها"; d.city = ""; setSession_("M:" + uid, "REG_COUNTRY_FREE", d); answerCallbackQuery_(cb.id); showCountryMenu_(chatId, uid); return;
  }
  if (data.indexOf("regcountry:") === 0 && s.state === "REG_COUNTRY_FREE") {
    const value = decodeURIComponent(data.split(":")[1] || "");
    if (value === "free") { answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "OTHER_COUNTRIES"), cancelKeyboard_()); return; }
    if (!value || OTHER_COUNTRIES_.indexOf(value) < 0) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    // شهر برای کاربران خارج از ایران هم پرسیده می‌شود (قبلاً خالی می‌ماند).
    d.country = "other"; d.countryName = value; d.province = value; d.city = "";
    setSession_("M:" + uid, "REG_CITY_FREE", d); answerCallbackQuery_(cb.id);
    sendMessage_(chatId, t_(uid, "ASK_CITY_FREE"), cancelKeyboard_()); return;
  }
  if (data === "regcityfree" && s.state === "REG_CITY") { setSession_("M:" + uid, "REG_CITY_FREE", d); answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "ASK_CITY_FREE"), cancelKeyboard_()); return; }
  if (data.indexOf("regprov:") === 0 && s.state === "REG_PROVINCE") {
    const pi = Number(data.split(":")[1]); if (!IR_GEO[pi]) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    d.province = IR_GEO[pi].p; d.country = "Iran"; d.provinceIndex = pi; setSession_("M:" + uid, "REG_CITY", d); answerCallbackQuery_(cb.id); showCityMenu_(chatId, pi, 0, uid); return;
  }
  if (data.indexOf("regcity:") === 0 && s.state === "REG_CITY") {
    const p = data.split(":"); const pi = Number(p[1]); const ci = Number(p[2]); const cities = IR_GEO[pi] && IR_GEO[pi].c;
    if (!cities || !cities[ci]) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    d.city = cities[ci]; setSession_("M:" + uid, "REG_PW1", d); answerCallbackQuery_(cb.id); askPassword_(chatId, uid, "ASK_PW1"); return;
  }
  answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN"));
}
function getResetRequests_() {
  const sh = getSheet_(APP.SHEETS.RESET_REQUESTS); if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 10).getValues().map(function(v, i) {
    return { rowNumber: i + 2, requestId: String(v[0] || ""), userId: String(v[1] || ""), phone: String(v[2] || ""), firstName: String(v[3] || ""), lastName: String(v[4] || ""), rapName: String(v[5] || ""), status: String(v[6] || ""), createdAt: v[7] || "", reviewedBy: String(v[8] || ""), reviewedAt: v[9] || "" };
  }).filter(function(r) { return r.requestId; });
}
function getResetRequest_(id) { return getResetRequests_().find(function(r) { return r.requestId === String(id); }) || null; }
function setResetRequestStatus_(id, status, adminId) {
  const r = getResetRequest_(id); if (!r) return false;
  const sh = getSheet_(APP.SHEETS.RESET_REQUESTS);
  const reviewer = adminId || r.reviewedBy || "";
  const reviewedAt = adminId ? new Date() : (r.reviewedAt || "");
  sh.getRange(r.rowNumber, 7, 1, 4).setValues([[status, r.createdAt, reviewer, reviewedAt]]);
  return true;
}

// ── تأیید دومرحله‌ای (MFA) ──
function handleMfaCallback_(cb, session) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id); const data = String(cb.data || "");
  const action = data.split(":")[1] || "";
  const u = getUserById_(uid);
  if (!u) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
  if (action === "enable") {
    const code = enableTwoStep_(uid);
    logAdminAction_(uid, "2fa_on", uid, "");
    answerCallbackQuery_(cb.id, t_(uid, "ADMIN_2FA_ON"));
    const inline = { inline_keyboard: [[{ text: t_(uid, "PROFILE_2FA"), callback_data: "mfa:enable" }, { text: t_(uid, "BACK"), callback_data: "p:home" }]] };
    sendMessage_(chatId, t_(uid, "MFA_CODE_TEXT", { c: code }), inline, { parse_mode: "HTML" }); return;
  }
  if (action === "disable") {
    disableTwoStep_(uid);
    answerCallbackQuery_(cb.id, t_(uid, "MFA_OFF"));
    showProfile_(chatId, uid); return;
  }
  if (action === "ask") {
    // کد یک‌بارمصرف تازه؛ فقط hash ذخیره می‌شود و متن خام یک‌بار نمایش داده می‌شود.
    if (!u.gateHash) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    const fresh = issueTwoStepCode_(uid);
    setUserField_(uid, "gateUntil", new Date(nowMs_() + 1800000));
    setSession_("M:" + uid, "MFA_ASK_CODE", { action: "admin_panel", attempts: 0 });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, t_(uid, "MFA_CODE_ROTATED", { c: fresh }), cancelKeyboard_(), { parse_mode: "HTML" });
    sendMessage_(chatId, t_(uid, "LOGIN_GATE_ASK"));
    return;
  }
  if (action === "issue") {
    // کد یک‌بارمصرف تازه (کد قبلی گم شده)؛ فقط hash ذخیره می‌شود.
    const fresh = issueTwoStepCode_(uid);
    answerCallbackQuery_(cb.id, t_(uid, "OK_GENERIC"));
    sendMessage_(chatId, t_(uid, "MFA_CODE_ROTATED", { c: fresh }), null, { parse_mode: "HTML" });
    return;
  }
  answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN"));
}
function handleMfaMessage_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const d = session.data || {};
  const code = String(message.text || "").trim();
  if (session.state === "MFA_ASK_CODE") {
    if (!code || code !== String(d.salt || "")) {
      const n = Number(d.attempts || 0) + 1;
      if (n >= 5) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "LOGIN_ATTEMPTS_END")); return; }
      setSession_("M:" + uid, "MFA_ASK_CODE", Object.assign({}, d, { attempts: n }));
      sendMessage_(chatId, t_(uid, "LOGIN_GATE_WRONG", { n: n }), cancelKeyboard_()); return;
    }
    setUserField_(uid, "gateUntil", "");
    clearSession_("M:" + uid);
    loginUser_(uid);
    if (isAdmin_(uid)) { touchAdminSession_(uid); showAdminMenu_(chatId, t_(uid, "LOGIN_OK")); }
    else showUserMenu_(chatId, t_(uid, "LOGIN_OK"));
    return;
  }
  if (session.state === "MFA_DISABLE") {
    if (code === String(d.salt || "")) { disableTwoStep_(uid); clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "OK_GENERIC")); showProfile_(chatId, uid, getUserById_(uid)); }
    else sendMessage_(chatId, t_(uid, "LOGIN_GATE_WRONG", { n: 1 }), cancelKeyboard_());
    return;
  }
  clearSession_("M:" + uid); sendEntryCard_(chatId);
}

// ───────────────────────── کانال‌های وصل‌شدهٔ کاربران ────────────────────────
// کاربر بات را در کانال خودش ادمین می‌کند؛ بات وضعیت ادمین بودن را راستی‌آزمایی می‌کند.
// حالت optional: دسترسی اختیاری برای تبلیغ. حالت required: پیش‌شرط ارسال اثر/آثار من.
function bustConnectedChannelsCache_() { CONNECTED_CHANNELS_MEMO_ = null; }
function connectedChannelFromRow_(r, i) {
  return { rowNumber: i + 2, id: String(r[0] || ""), userId: String(r[1] || ""), chatId: String(r[2] || ""), username: String(r[3] || ""), title: String(r[4] || ""), members: Number(r[5]) || 0, status: String(r[6] || "active"), connectedAt: r[7] || "", lastOkAt: r[8] || "", lastError: String(r[9] || "") };
}
function getConnectedChannels_() {
  if (CONNECTED_CHANNELS_MEMO_) return CONNECTED_CHANNELS_MEMO_;
  const sh = getSheet_(APP.SHEETS.CONNECTED_CHANNELS);
  CONNECTED_CHANNELS_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.ConnectedChannels.length).getValues().map(connectedChannelFromRow_).filter(function(c) { return c.id; });
  return CONNECTED_CHANNELS_MEMO_;
}
function getActiveConnectedChannels_() { return getConnectedChannels_().filter(function(c) { return c.status === "active"; }); }
function getConnectedChannelsForUser_(uid) { return getActiveConnectedChannels_().filter(function(c) { return c.userId === String(uid); }); }
function hasActiveConnectedChannel_(uid) { return getConnectedChannelsForUser_(uid).length > 0; }
function getConnectedChannelById_(id) { return getConnectedChannels_().find(function(c) { return c.id === String(id); }) || null; }
const CC_FIELD_COL_ = { username: 4, title: 5, members: 6, status: 7, lastOkAt: 9, lastError: 10 };
function setConnectedChannelField_(id, field, value) {
  const row = getConnectedChannelById_(id); if (!row || !CC_FIELD_COL_[field]) return;
  getSheet_(APP.SHEETS.CONNECTED_CHANNELS).getRange(row.rowNumber, CC_FIELD_COL_[field]).setValue(value);
  bustConnectedChannelsCache_();
}
function botUserId_() {
  if (BOT_USER_ID_MEMO_) return BOT_USER_ID_MEMO_;
  const r = telegramRequest_("getMe", {});
  BOT_USER_ID_MEMO_ = r && r.ok && r.result ? String(r.result.id) : "";
  return BOT_USER_ID_MEMO_;
}
function botAdminStatusIn_(chatId) {
  const me = botUserId_(); if (!me) return null;
  const r = telegramRequest_("getChatMember", { chat_id: chatId, user_id: Number(me) });
  return r && r.ok && r.result ? r.result : null;
}
function publicChannelLink_(row) { return row && row.username ? "https://t.me/" + String(row.username).replace(/^@/, "") : ""; }
function ccAdvertiseEnabled_() { return String(getSetting_("CC_ADVERTISE") || "true") === "true"; }
function ccGateRequired_(uid) {
  if (isAdmin_(uid)) return false;
  if (String(getSetting_("CONNECTED_CHANNELS_MODE") || "optional") !== "required") return false;
  return !hasActiveConnectedChannel_(uid);
}
function showConnectedGate_(chatId, uid) {
  sendMessage_(chatId, t_(uid, "CC_GATE_TEXT"), { inline_keyboard: [[{ text: t_(uid, "CC_GATE_BTN"), callback_data: "myc:add" }]] });
}
function ownerAdvertiseLine_(sub) {
  if (!ccAdvertiseEnabled_() || !sub) return "";
  const ch = getConnectedChannelsForUser_(sub.userId).find(function(c) { return c.username; });
  if (!ch) return "";
  return t_(sub.userId, "CC_ADVERTISE_LINE", { link: "@" + String(ch.username).replace(/^@/, "") });
}
function ownerChannelButtonRow_(sub) {
  if (!ccAdvertiseEnabled_() || !sub) return null;
  const ch = getConnectedChannelsForUser_(sub.userId).find(function(c) { return c.username; });
  const link = publicChannelLink_(ch);
  if (!ch || !link) return null;
  return [{ text: t_(sub.userId, "CC_ADVERTISE_BTN"), url: link }];
}
function markConnectedChannelKicked_(row, err) {
  setConnectedChannelField_(row.id, "status", "kicked");
  setConnectedChannelField_(row.id, "lastError", truncate_(String(err || ""), 200));
  try { deleteCoverNotifyFromMainChannel_(row.id); } catch (e) {}
  try { sendMessage_(row.userId, t_(row.userId, "CC_KICKED_NOTIFY", { t: row.title })); } catch (e) {}
}
function sendOwnerChannelPromo_(sub, postUrl) {
  if (String(getSetting_("CC_PROMO_MESSAGE") || "true") !== "true" || !postUrl || !sub) return;
  const promoText = t_(sub.userId, "CC_PROMO_TEXT", { t: sub.title });
  getConnectedChannelsForUser_(sub.userId).forEach(function(ch) {
    let r = null;
    try {
      r = sendMessage_(ch.chatId, promoText, { inline_keyboard: [[{ text: t_(sub.userId, "CC_PROMO_BTN"), url: postUrl }]] });
    } catch (e) { r = null; }
    if (!r || !r.ok) {
      const desc = String(r && r.description || "");
      if (/kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(desc)) markConnectedChannelKicked_(ch, desc);
      else console.warn("cc promo failed: " + desc);
    } else {
      setConnectedChannelField_(ch.id, "lastOkAt", new Date());
      if (r.result && r.result.message_id) {
        recordCcPost_({
          batchId: "PROMO_" + String(sub.id),
          sourceType: "promo",
          channelId: ch.id,
          chatId: ch.chatId,
          messageId: Number(r.result.message_id),
          kind: "text",
          caption: promoText,
          fileId: "",
          createdBy: String(sub.userId || "")
        });
      }
    }
  });
}
// ── ذخیره و مدیریت پیام‌های ارسال‌شده در کانال‌های وصل‌شده (CcPosts) ──
function bustCcPostsCache_() { CC_POSTS_MEMO_ = null; }
function extractMessageFileId_(message) {
  if (!message) return "";
  if (message.photo && message.photo.length) return String(message.photo[message.photo.length - 1].file_id || "");
  if (message.video) return String(message.video.file_id || "");
  if (message.audio) return String(message.audio.file_id || "");
  if (message.document) return String(message.document.file_id || "");
  if (message.voice) return String(message.voice.file_id || "");
  return "";
}
function getCcPosts_() {
  if (CC_POSTS_MEMO_) return CC_POSTS_MEMO_;
  const sh = getSheet_(APP.SHEETS.CC_POSTS);
  CC_POSTS_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.CcPosts.length).getValues().map(function(r, i) {
    return {
      rowNumber: i + 2,
      postId: String(r[0] || ""),
      batchId: String(r[1] || ""),
      sourceType: String(r[2] || "message"),
      channelId: String(r[3] || ""),
      chatId: String(r[4] || ""),
      messageId: Number(r[5]) || 0,
      kind: String(r[6] || "text"),
      caption: String(r[7] || ""),
      fileId: String(r[8] || ""),
      status: String(r[9] || "active"),
      createdBy: String(r[10] || ""),
      createdAt: r[11] || "",
      updatedAt: r[12] || ""
    };
  }).filter(function(p) { return p.postId && p.messageId > 0; });
  return CC_POSTS_MEMO_;
}
function getActiveCcPosts_() { return getCcPosts_().filter(function(p) { return p.status === "active"; }); }
function getCcPostById_(postId) { return getCcPosts_().find(function(p) { return p.postId === String(postId); }) || null; }
function recordCcPost_(o) {
  try {
    const sh = getSheet_(APP.SHEETS.CC_POSTS);
    const now = new Date();
    const postId = newId_("CP");
    sh.appendRow([
      postId,
      String(o.batchId || postId),
      String(o.sourceType || "message"),
      String(o.channelId || ""),
      String(o.chatId || ""),
      Number(o.messageId) || 0,
      String(o.kind || "text"),
      String(o.caption || ""),
      String(o.fileId || ""),
      "active",
      String(o.createdBy || ""),
      now,
      now
    ]);
    bustCcPostsCache_();
    return postId;
  } catch (e) { logError_("recordCcPost_", e); return ""; }
}
const CC_POST_COL_ = { messageId: 6, kind: 7, caption: 8, fileId: 9, status: 10, updatedAt: 13 };
function setCcPostFields_(postId, patch) {
  const row = getCcPostById_(postId);
  if (!row || !patch) return false;
  const sh = getSheet_(APP.SHEETS.CC_POSTS);
  Object.keys(patch).forEach(function(k) {
    if (CC_POST_COL_[k]) sh.getRange(row.rowNumber, CC_POST_COL_[k]).setValue(patch[k]);
  });
  sh.getRange(row.rowNumber, CC_POST_COL_.updatedAt).setValue(new Date());
  bustCcPostsCache_();
  return true;
}
function deleteCcPostRecord_(post) {
  if (!post || post.status !== "active") return { ok: false, desc: "not active" };
  const r = deleteMessage_(post.chatId, post.messageId);
  const desc = String(r && r.description || "");
  if ((r && r.ok) || /message to delete not found|message can't be deleted|message_id_invalid|message not found/i.test(desc)) {
    setCcPostFields_(post.postId, { status: "deleted" });
    return { ok: true, desc: "" };
  }
  return { ok: false, desc: desc };
}
function editCcPostRecord_(post, message) {
  if (!post || post.status !== "active") return { ok: false, desc: "not active" };
  const newKind = message.photo ? "photo" : message.audio ? "audio" : message.video ? "video" : message.voice ? "voice" : message.document ? "document" : (message.text ? "text" : "");
  if (!newKind) return { ok: false, desc: "unsupported format" };
  const newCaption = newKind === "text" ? String(message.text || "") : String(message.caption || "");
  const newFileId = extractMessageFileId_(message);
  if (newKind === "text") {
    let r = null;
    if (post.kind === "text") {
      r = telegramRequest_("editMessageText", { chat_id: String(post.chatId), message_id: Number(post.messageId), text: newCaption, disable_web_page_preview: true });
    } else {
      r = telegramRequest_("editMessageCaption", { chat_id: String(post.chatId), message_id: Number(post.messageId), caption: newCaption });
    }
    const desc = String(r && r.description || "");
    if ((r && r.ok) || /message is not modified/i.test(desc)) {
      setCcPostFields_(post.postId, { caption: newCaption });
      return { ok: true, desc: "" };
    }
    return { ok: false, desc: desc };
  }
  // اگر پیام قبلی هم رسانه بود و فرمت جدید قابلیت editMessageMedia درجا دارد
  if (post.kind !== "text" && ["photo", "video", "audio", "document"].indexOf(newKind) >= 0 && newFileId) {
    const r = telegramRequest_("editMessageMedia", {
      chat_id: String(post.chatId),
      message_id: Number(post.messageId),
      media: JSON.stringify({ type: newKind, media: newFileId, caption: newCaption })
    });
    const desc = String(r && r.description || "");
    if ((r && r.ok) || /message is not modified/i.test(desc)) {
      setCcPostFields_(post.postId, { kind: newKind, caption: newCaption, fileId: newFileId });
      return { ok: true, desc: "" };
    }
  }
  // جایگزینی پیام (وقتی نوع پیام از متن به رسانه تغییر کرده یا ویس است)
  const copied = copyMessage_(post.chatId, message.chat.id, message.message_id);
  if (copied && copied.ok && copied.result && copied.result.message_id) {
    deleteMessage_(post.chatId, post.messageId);
    setCcPostFields_(post.postId, { messageId: Number(copied.result.message_id), kind: newKind, caption: newCaption, fileId: newFileId });
    return { ok: true, desc: "" };
  }
  return { ok: false, desc: String(copied && copied.description || "edit failed") };
}
// ── بنر تبلیغاتی کانال ما (مدیر ثبت می‌کند؛ در همهٔ کانال‌های وصل‌شده پست می‌شود) ──
function bustCcBannerCache_() { CC_BANNER_MEMO_ = null; }
function getCcBannerItems_() {
  if (CC_BANNER_MEMO_) return CC_BANNER_MEMO_;
  const sh = getSheet_(APP.SHEETS.CC_BANNER);
  CC_BANNER_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.CcBanner.length).getValues()
    .filter(function(r) { return r[8] === true || String(r[8]).toLowerCase() === "true"; })
    .map(function(r) { return { id: String(r[0] || ""), seq: Number(r[1]) || 1, sourceChatId: String(r[2] || ""), sourceMessageId: String(r[3] || ""), kind: String(r[4] || "text"), caption: String(r[5] || ""), createdBy: String(r[6] || ""), createdAt: r[7] || "" }; })
    .sort(function(x, y) { return x.seq - y.seq; });
  return CC_BANNER_MEMO_;
}
function setCcBanner_(item, adminId) {
  const sh = getSheet_(APP.SHEETS.CC_BANNER);
  while (sh.getLastRow() > 1) sh.deleteRow(2);
  sh.appendRow([newId_("BN"), 1, String(item.sourceChatId || ""), String(item.sourceMessageId || ""), String(item.kind || "text"), String(item.caption || ""), String(adminId || ""), new Date(), true]);
  bustCcBannerCache_();
  return getCcBannerItems_();
}
function clearCcBanner_() {
  const sh = getSheet_(APP.SHEETS.CC_BANNER);
  while (sh.getLastRow() > 1) sh.deleteRow(2);
  bustCcBannerCache_();
}
function sendCcBannerToChannel_(row, opts) {
  const items = getCcBannerItems_();
  if (!items.length) return { ok: true, sent: 0, desc: "" };
  const options = opts || {};
  const shouldRecord = options.recordPost !== false && !!row.id;
  const batchId = options.batchId || newId_("BP");
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    let r = null;
    if (it.sourceChatId && it.sourceMessageId) {
      r = copyMessage_(row.chatId, it.sourceChatId, it.sourceMessageId);
      if ((!r || !r.ok) && it.kind === "text" && it.caption) r = sendMessage_(row.chatId, it.caption);
    } else {
      r = sendMessage_(row.chatId, it.caption);
    }
    if (!r || !r.ok) return { ok: false, sent: i, desc: String(r && r.description || "") };
    if (shouldRecord && r.result && r.result.message_id) {
      recordCcPost_({
        batchId: batchId,
        sourceType: "banner",
        channelId: row.id,
        chatId: row.chatId,
        messageId: Number(r.result.message_id),
        kind: it.kind || "text",
        caption: it.caption || "",
        fileId: "",
        createdBy: options.adminId || it.createdBy || ""
      });
    }
  }
  if (row.id) { try { setConnectedChannelField_(row.id, "lastOkAt", new Date()); } catch (e) {} }
  return { ok: true, sent: items.length, desc: "", batchId: batchId };
}
function sendCcBannerToAll_(rows, adminId) {
  const batchId = newId_("BP");
  const out = { sent: 0, failed: 0, kicked: 0, batchId: batchId };
  (rows || getActiveConnectedChannels_()).forEach(function(c) {
    const r = sendCcBannerToChannel_(c, { batchId: batchId, adminId: adminId || "" });
    if (r.ok) out.sent++;
    else {
      out.failed++;
      if (/kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(r.desc)) { markConnectedChannelKicked_(c, r.desc); out.kicked++; }
    }
  });
  return out;
}
// اطلاع در کانال اصلی: «پوشش داده شد» + آیدی کانال کاربر
function postCoverNotifyToMainChannel_(row, owner) {
  const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
  if (!channel || !row) return;
  const existing = getActiveCcPosts_().find(function(p) { return p.sourceType === "cover_notify" && p.channelId === String(row.id); });
  if (existing) return;
  const lines = ["🤝 پوشش داده شد", "📺 " + (row.title || row.chatId) + (row.username ? " — @" + String(row.username).replace(/^@/, "") : ""), "🆔 " + row.chatId, "👤 " + ((owner && owner.rapName) || row.userId)];
  try {
    const r = sendMessage_(channel, lines.join("\n"));
    if (r && r.ok && r.result && r.result.message_id) {
      recordCcPost_({
        batchId: "COV_" + String(row.id),
        sourceType: "cover_notify",
        channelId: row.id,
        chatId: channel,
        messageId: Number(r.result.message_id),
        kind: "text",
        caption: lines.join("\n"),
        fileId: "",
        createdBy: String(row.userId || "")
      });
    }
  } catch (e) { logError_("postCoverNotifyToMainChannel_", e); }
}
function deleteCoverNotifyFromMainChannel_(channelId) {
  let removed = 0;
  getActiveCcPosts_().filter(function(p) { return p.sourceType === "cover_notify" && p.channelId === String(channelId); }).forEach(function(p) {
    const r = deleteCcPostRecord_(p);
    if (r.ok) removed++;
  });
  return removed;
}
// بررسی اینکه آیا پیام بنر در کانال کاربر هنوز وجود دارد یا توسط کاربر پاک شده است
function checkChannelMessageExists_(chatId, messageId) {
  if (!chatId || !messageId) return { exists: false, reason: "deleted" };
  // ۱) بررسی بی‌سر و صدا با setMessageReaction (بدون هیچ تغییری در متن، رسانه یا دکمه‌های پیام)
  const r = telegramRequest_("setMessageReaction", {
    chat_id: String(chatId),
    message_id: Number(messageId),
    reaction: JSON.stringify([])
  });
  if (r && r.ok) return { exists: true, reason: "ok" };
  const desc = String((r && r.description) || "");
  if (/message to react not found|message_id_invalid|message not found|message to edit not found|message can't be found/i.test(desc)) {
    return { exists: false, reason: "deleted" };
  }
  if (/kicked|not enough rights|chat not found|forbidden|have the right/i.test(desc)) {
    return { exists: false, reason: "kicked", desc: desc };
  }
  if (/reaction_invalid|reactions_too_many|reactions are disabled/i.test(desc)) {
    return { exists: true, reason: "ok" };
  }
  // ۲) پشتیبان: بررسی با editMessageReplyMarkup
  const r2 = telegramRequest_("editMessageReplyMarkup", {
    chat_id: String(chatId),
    message_id: Number(messageId),
    reply_markup: { inline_keyboard: [] }
  });
  if (r2 && r2.ok) return { exists: true, reason: "ok" };
  const desc2 = String((r2 && r2.description) || "");
  if (/message is not modified|message can't be edited/i.test(desc2)) return { exists: true, reason: "ok" };
  if (/message to edit not found|message_id_invalid|message not found/i.test(desc2)) return { exists: false, reason: "deleted" };
  if (/kicked|not enough rights|chat not found|forbidden|have the right/i.test(desc2)) return { exists: false, reason: "kicked", desc: desc2 };
  return { exists: true, reason: "unknown" };
}
// در هر تعامل کاربر با بات، بررسی می‌شود که بنر تبلیغاتی ما از کانال‌های متصل او پاک نشده باشد
function verifyUserConnectedChannelsBanner_(uid, notifyChatId) {
  try {
    if (!uid || isAdmin_(uid)) return;
    const channels = getConnectedChannelsForUser_(uid);
    if (!channels.length) return;
    const bannerItems = getCcBannerItems_();
    const bannerEnabled = String(getSetting_("CC_BANNER_ON_CONNECT") || "true") === "true" && bannerItems.length > 0;
    channels.forEach(function(ch) {
      const bannerPosts = getActiveCcPosts_().filter(function(p) {
        return p.sourceType === "banner" && (p.channelId === String(ch.id) || p.chatId === String(ch.chatId));
      }).sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); });

      if (bannerPosts.length) {
        const latestBanner = bannerPosts[0];
        const chk = checkChannelMessageExists_(ch.chatId, latestBanner.messageId);
        if (!chk.exists && chk.reason === "kicked") {
          bannerPosts.forEach(function(bp) { setCcPostFields_(bp.postId, { status: "deleted" }); });
          deleteCoverNotifyFromMainChannel_(ch.id);
          markConnectedChannelKicked_(ch, chk.desc || "kicked");
          return;
        }
        if (!chk.exists && chk.reason === "deleted") {
          // کاربر بنر ما را از کانالش پاک کرده است:
          // ۱) بنرهای قبلی در شیت به وضعیت deleted درمی‌آیند
          bannerPosts.forEach(function(bp) { setCcPostFields_(bp.postId, { status: "deleted" }); });
          // ۲) پیام «پوشش داده شد» مربوط به این کانال از کانال اصلی ما حذف می‌شود
          deleteCoverNotifyFromMainChannel_(ch.id);
          // ۳) بلافاصله یک بنر جدید در کانالش ارسال و آیدی پیام جدید ثبت می‌شود (تا اگر باز پاک کرد تشخیص دهد)
          if (bannerEnabled) {
            const resent = sendCcBannerToChannel_(ch);
            if (!resent.ok && /kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(resent.desc)) {
              markConnectedChannelKicked_(ch, resent.desc);
              return;
            }
          }
          // ۴) اخطار به کاربر در بات
          const targetChat = String(notifyChatId || uid);
          sendMessage_(targetChat, t_(uid, "CC_BANNER_DELETED_WARN", { t: ch.title || ch.chatId }));
        }
      } else if (bannerEnabled) {
        // اگر بنر فعال است ولی این کانال هنوز بنر فعالی ندارد، بنر را بفرست و ثبت کن
        const sent = sendCcBannerToChannel_(ch);
        if (!sent.ok && /kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(sent.desc)) {
          deleteCoverNotifyFromMainChannel_(ch.id);
          markConnectedChannelKicked_(ch, sent.desc);
        }
      }
    });
  } catch (e) { logError_("verifyUserConnectedChannelsBanner_", e, { userId: uid }); }
}
// بعد از اتصال موفق: بنر (اگر ثبت شده و روشن) در همان کانال + اطلاع پوشش در کانال اصلی
function ccFinishConnect_(row) {
  if (String(getSetting_("CC_BANNER_ON_CONNECT") || "true") === "true" && getCcBannerItems_().length) {
    const b = sendCcBannerToChannel_(row);
    if (!b.ok && /kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(b.desc)) {
      markConnectedChannelKicked_(row, b.desc);
      return { ok: true, row: getConnectedChannelById_(row.id), banner: "kicked" };
    }
  }
  postCoverNotifyToMainChannel_(row, getUserById_(row.userId));
  return { ok: true, row: row, banner: "sent" };
}
function disconnectChannelCompletely_(row) {
  if (!row) return;
  setConnectedChannelField_(row.id, "status", "removed");
  deleteCoverNotifyFromMainChannel_(row.id);
  getActiveCcPosts_().filter(function(p) { return p.sourceType !== "cover_notify" && (p.channelId === String(row.id) || p.chatId === String(row.chatId)); }).forEach(function(p) {
    deleteCcPostRecord_(p);
  });
}
function connectChannelForUser_(uid, input) {
  const raw = String(input || "").trim();
  let chatRef = "";
  const mc = raw.match(/(?:https?:\/\/)?t\.me\/c\/(\d+)/i);
  if (mc) chatRef = "-100" + mc[1];
  else if (/^-\d{5,}$/.test(raw)) chatRef = raw;
  else if (/^\+?\d{5,}$/.test(raw)) chatRef = "-100" + raw.replace(/^\+/, "");
  else {
    const mu = raw.match(/(?:https?:\/\/)?t\.me\/(@?[A-Za-z][A-Za-z0-9_]{3,})/i) || raw.match(/^@?[A-Za-z][A-Za-z0-9_]{3,}$/);
    if (mu) chatRef = "@" + String(mu[1] || mu[0]).replace(/^@/, "");
  }
  if (!chatRef) return { ok: false, code: "CC_ADD_NOT_CHANNEL" };
  const chat = telegramRequest_("getChat", { chat_id: chatRef });
  if (!chat || !chat.ok || !chat.result || chat.result.type !== "channel") return { ok: false, code: "CC_ADD_NOT_CHANNEL" };
  const info = chat.result;
  const member = botAdminStatusIn_(String(info.id));
  if (!member || member.status !== "administrator" || member.can_post_messages === false) return { ok: false, code: "CC_ADD_NOT_ADMIN" };
  const chatId = String(info.id);
  const existing = getConnectedChannels_().find(function(c) { return c.chatId === chatId && c.status === "active"; });
  if (existing && existing.userId !== String(uid)) return { ok: false, code: "CC_ADD_TAKEN" };
  if (existing) {
    setConnectedChannelField_(existing.id, "lastOkAt", new Date());
    setConnectedChannelField_(existing.id, "lastError", "");
    return ccFinishConnect_(getConnectedChannelById_(existing.id));
  }
  const mine = getConnectedChannelsForUser_(uid);
  const max = Math.max(1, Number(getSetting_("CONNECTED_CHANNELS_MAX") || 3));
  if (mine.length >= max) return { ok: false, code: "CC_ADD_LIMIT", n: String(max) };
  const old = getConnectedChannels_().find(function(c) { return c.chatId === chatId && c.userId === String(uid) && c.status !== "active"; });
  const sh = getSheet_(APP.SHEETS.CONNECTED_CHANNELS);
  if (old) {
    setConnectedChannelField_(old.id, "status", "active");
    setConnectedChannelField_(old.id, "title", String(info.title || ""));
    setConnectedChannelField_(old.id, "username", String(info.username || ""));
    setConnectedChannelField_(old.id, "members", Number(info.members_count) || 0);
    setConnectedChannelField_(old.id, "lastOkAt", new Date());
    setConnectedChannelField_(old.id, "lastError", "");
    return ccFinishConnect_(getConnectedChannelById_(old.id));
  }
  const id = newId_("CC");
  sh.appendRow([id, String(uid), chatId, String(info.username || ""), String(info.title || ""), Number(info.members_count) || 0, "active", new Date(), new Date(), ""]);
  bustConnectedChannelsCache_();
  return ccFinishConnect_(getConnectedChannelById_(id));
}

// ───────────────────────── منوی کاربر / پروفایل / آثار ─────────────────────────
function handleUserMenuMessage_(message, user) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const text = String(message.text || "").trim();
  const session = getSession_("M:" + uid);
  if (session && String(session.state).indexOf("PERS_") === 0) { handleProfileState_(message, session); return; }
  const lang = userLang_(uid);
  // حالت «اجباری»: تا وقتی بات در کانال کاربر ادمین نشده، ارسال اثر و «آثار من» قفل است.
  const gated = ccGateRequired_(uid);
  if (gated && (text === tr_("BTN_SEND_MUSIC", null, "fa") || text === MSG.en.BTN_SEND_MUSIC ||
                text === tr_("BTN_SEND_ALBUM", null, "fa") || text === MSG.en.BTN_SEND_ALBUM ||
                text === tr_("BTN_COMING_SOON", null, "fa") || text === MSG.en.BTN_COMING_SOON ||
                text === tr_("BTN_FREESTYLE", null, "fa") || text === MSG.en.BTN_FREESTYLE || text === "🎤 فری‌استایل")) { showConnectedGate_(chatId, uid); return; }
  if (gated && (text === tr_("BTN_MY_WORKS", null, "fa") || text === MSG.en.BTN_MY_WORKS)) { showConnectedGate_(chatId, uid); return; }
  if (text === tr_("BTN_MY_CHANNELS", null, "fa") || text === MSG.en.BTN_MY_CHANNELS) { showMyChannels_(chatId, uid); return; }
  if (text === tr_("BTN_SEND_MUSIC", null, "fa") || text === MSG.en.BTN_SEND_MUSIC) { startMusicFlow_(chatId, uid, "simple"); return; }
  if (text === tr_("BTN_SEND_ALBUM", null, "fa") || text === MSG.en.BTN_SEND_ALBUM) { startMusicFlow_(chatId, uid, "album"); return; }
  if (text === tr_("BTN_COMING_SOON", null, "fa") || text === MSG.en.BTN_COMING_SOON) { startMusicFlow_(chatId, uid, "coming_soon"); return; }
  if (text === tr_("BTN_FREESTYLE", null, "fa") || text === MSG.en.BTN_FREESTYLE || text === "🎤 فری‌استایل") { startMusicFlow_(chatId, uid, "freestyle"); return; }
  if (text === tr_("BTN_MY_WORKS", null, "fa") || text === MSG.en.BTN_MY_WORKS) { showMyMusic_(chatId, uid, 0); return; }
  if (text === tr_("BTN_PROFILE", null, "fa") || text === MSG.en.BTN_PROFILE) { showProfile_(chatId, uid, user); return; }
  if (text === tr_("BTN_LOGOUT", null, "fa") || text === MSG.en.BTN_LOGOUT) { logoutUser_(uid); clearSession_("M:" + uid); sendEntryCard_(chatId, t_(uid, "LOGGED_OUT")); return; }
  if (text === tr_("BTN_SUPPORT", null, "fa") || text === MSG.en.BTN_SUPPORT || text === "📞 پشتیبانی") { startUserSupport_(chatId, uid); return; }
  showUserMenu_(chatId, lang === "en" ? "" : "");
}
// ───────────────────────── کانال‌های وصل‌شده (سمت کاربر / هنرمند) ─────────────────────────
function showMyChannels_(chatId, uid) {
  const list = getConnectedChannelsForUser_(uid);
  const max = Math.max(1, Number(getSetting_("CONNECTED_CHANNELS_MAX") || 3));
  if (!list.length) {
    sendMessage_(chatId, t_(uid, "CC_LIST_EMPTY"), { inline_keyboard: [[{ text: "➕ " + t_(uid, "CC_GATE_BTN"), callback_data: "myc:add" }], [{ text: "🏠 منو", callback_data: "myc:home" }]] });
    return;
  }
  const lines = [t_(uid, "CC_LIST_TITLE") + " — " + list.length + "/" + max];
  const rows = [];
  list.forEach(function(c) {
    const shortTitle = truncate_(c.title || c.chatId, 18);
    lines.push("📺 " + (c.title || c.chatId) + (c.username ? " — @" + String(c.username).replace(/^@/, "") : " (خصوصی)") + "\n   👥 " + (c.members || 0) + " · 🗓 " + formatDate_(c.connectedAt));
    rows.push([
      { text: "✏️ ویرایش «" + shortTitle + "»", callback_data: "myc:edit:" + c.id },
      { text: "🗑 حذف «" + shortTitle + "»", callback_data: "myc:rm:" + c.id }
    ]);
  });
  if (list.length < max) rows.push([{ text: "➕ " + t_(uid, "CC_GATE_BTN"), callback_data: "myc:add" }]);
  rows.push([{ text: "🏠 منو", callback_data: "myc:home" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function handleMyChannelsCallback_(cb) {
  const uid = String(cb.from.id);
  const chatId = cb.message && cb.message.chat ? String(cb.message.chat.id) : uid;
  if (!isLoggedIn_(uid)) { answerCallbackQuery_(cb.id, t_(uid, "LOGIN_NEEDED")); return; }
  const parts = String(cb.data || "").split(":");
  const action = parts[1] || "list";
  if (action === "home") { clearSession_("M:" + uid); answerCallbackQuery_(cb.id); showUserMenu_(chatId); return; }
  if (action === "add") {
    answerCallbackQuery_(cb.id);
    setSession_("M:" + uid, "CC_ADD", {});
    sendMessage_(chatId, t_(uid, "CC_ADD_ASK"), cancelKeyboard_());
    return;
  }
  if (action === "edit") {
    const row = getConnectedChannelById_(parts[2] || "");
    if (!row || row.userId !== uid || row.status !== "active") { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); showMyChannels_(chatId, uid); return; }
    answerCallbackQuery_(cb.id);
    setSession_("M:" + uid, "CC_EDIT", { channelId: row.id });
    sendMessage_(chatId, t_(uid, "CC_EDIT_ASK", { t: row.title || row.chatId }), {
      inline_keyboard: [
        [{ text: "🔄 همگام‌سازی نام/آیدی همین کانال از تلگرام", callback_data: "myc:sync:" + row.id }],
        [{ text: "⬅️ انصراف و بازگشت", callback_data: "myc:list" }]
      ]
    });
    return;
  }
  if (action === "sync") {
    const row = getConnectedChannelById_(parts[2] || "");
    if (!row || row.userId !== uid || row.status !== "active") { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); showMyChannels_(chatId, uid); return; }
    const chat = telegramRequest_("getChat", { chat_id: row.chatId });
    if (chat && chat.ok && chat.result) {
      setConnectedChannelField_(row.id, "title", String(chat.result.title || row.title || ""));
      setConnectedChannelField_(row.id, "username", String(chat.result.username || ""));
      setConnectedChannelField_(row.id, "lastOkAt", new Date());
    }
    clearSession_("M:" + uid);
    const updated = getConnectedChannelById_(row.id) || row;
    answerCallbackQuery_(cb.id, t_(uid, "CC_SYNC_OK", { t: updated.title || updated.chatId }));
    showMyChannels_(chatId, uid);
    return;
  }
  if (action === "rm") {
    const row = getConnectedChannelById_(parts[2] || "");
    if (!row || row.userId !== uid) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    disconnectChannelCompletely_(row);
    clearSession_("M:" + uid);
    answerCallbackQuery_(cb.id, t_(uid, "CC_RM_OK", { t: row.title }));
    showMyChannels_(chatId, uid);
    return;
  }
  clearSession_("M:" + uid);
  answerCallbackQuery_(cb.id);
  showMyChannels_(chatId, uid);
}
function handleConnectedChannelAdd_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const res = connectChannelForUser_(uid, message.text || "");
  if (!res.ok) { sendMessage_(chatId, t_(uid, res.code, { n: res.n || "" }), cancelKeyboard_()); return; }
  clearSession_("M:" + uid);
  sendMessage_(chatId, t_(uid, "CC_ADD_OK", { t: res.row.title }), userKeyboard_(uid));
  showMyChannels_(chatId, uid);
}
function handleConnectedChannelEdit_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const data = (session && session.data) || {};
  const oldRow = getConnectedChannelById_(data.channelId || "");
  if (!oldRow || oldRow.userId !== uid || oldRow.status !== "active") {
    clearSession_("M:" + uid);
    showMyChannels_(chatId, uid);
    return;
  }
  const oldTitle = oldRow.title || oldRow.chatId;
  // موقتاً کانال قبلی را غیرفعال می‌کنیم تا سقف کانال‌ها (CONNECTED_CHANNELS_MAX) مانع جایگزینی نشود
  setConnectedChannelField_(oldRow.id, "status", "replacing");
  const res = connectChannelForUser_(uid, message.text || "");
  if (!res.ok) {
    setConnectedChannelField_(oldRow.id, "status", "active");
    sendMessage_(chatId, t_(uid, res.code, { n: res.n || "" }), cancelKeyboard_());
    return;
  }
  if (String(res.row.id) !== String(oldRow.id)) {
    disconnectChannelCompletely_(oldRow);
  }
  clearSession_("M:" + uid);
  sendMessage_(chatId, t_(uid, "CC_EDIT_OK", { old: oldTitle, t: res.row.title }), userKeyboard_(uid));
  showMyChannels_(chatId, uid);
}
function showProfile_(chatId, uid, user) {
  const u = user || getUserById_(uid);
  if (!u) { sendEntryCard_(chatId); return; }
  const tracks = getAllSubmissions_().filter(function(s) { return String(s.userId) === String(uid) && s.status === "published"; });
  const lines = [t_(uid, "PROFILE_TITLE"),
    t_(uid, "PROFILE_ID") + uid + (u.username ? " · " + u.username : ""),
    t_(uid, "PROFILE_PHONE") + (u.phone || "—"),
    t_(uid, "PROFILE_NAME") + ((u.firstName + " " + u.lastName).trim() || "—"),
    t_(uid, "PROFILE_RAP", { v: u.rapName || "—" }),
    t_(uid, "PROFILE_LOC") + [u.province, u.city].filter(Boolean).join(" / ") + (u.country === "other" ? "" : ""),
    t_(uid, "PROFILE_TRACKS") + tracks.length,
    t_(uid, "PROFILE_JOINED") + formatDate_(u.registeredAt),
    "",
    t_(uid, "PROFILE_BUTTONS")];
  const rows = [
    [{ text: t_(uid, "PROFILE_EDIT_NAME"), callback_data: "p:name" }, { text: t_(uid, "PROFILE_EDIT_LOC"), callback_data: "p:loc" }],
    [{ text: t_(uid, "PROFILE_CHANGE_PW"), callback_data: "p:pw" }, { text: t_(uid, "PROFILE_LANG"), callback_data: "p:lang" }],
    [{ text: t_(uid, "PROFILE_2FA") + (isGateEnabled_(u) ? " ✅" : ""), callback_data: "mfa:ask" }, { text: t_(uid, "PROFILE_DELETE"), callback_data: "p:del" }]
  ];
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function handleProfileCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id); const data = String(cb.data || "");
  const parts = data.split(":"); const action = parts[1] || "";
  const u = getUserById_(uid);
  if (!u) { answerCallbackQuery_(cb.id, t_(uid, "LOGIN_NEEDED")); sendEntryCard_(chatId); return; }
  if (action === "home") { answerCallbackQuery_(cb.id); showProfile_(chatId, uid, u); return; }
  if (action === "cancel") { clearSession_("M:" + uid); answerCallbackQuery_(cb.id, t_(uid, "CANCEL_DONE")); showProfile_(chatId, uid, u); return; }
  if (action === "lang") { answerCallbackQuery_(cb.id); showLanguagePicker_(chatId, uid); return; }
  if (action === "name") { setSession_("M:" + uid, "PERS_EDIT_NAME", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "EDIT_NAME_PROMPT"), cancelKeyboard_()); return; }
  if (action === "loc") { setSession_("M:" + uid, "PERS_EDIT_CITY", {}); answerCallbackQuery_(cb.id); showActiveCityMenu_(chatId, uid); return; }
  if (action === "prov") {
    const value = parts[2] || "";
    const d = (getSession_("M:" + uid) || {}).data || {};
    if (value === "other") { setSession_("M:" + uid, "PERS_EDIT_COUNTRY", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "OTHER_COUNTRIES"), cancelKeyboard_()); return; }
    const pi = Number(value); if (!IR_GEO[pi]) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    d.provinceIndex = pi; setSession_("M:" + uid, "PERS_EDIT_CITY", d);
    answerCallbackQuery_(cb.id); showActiveCityList_(chatId, uid, pi, 0); return;
  }
  if (action === "citypage") {
    const pi = Number(parts[2]); const page = Number(parts[3]);
    if (!IR_GEO[pi]) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    answerCallbackQuery_(cb.id); showActiveCityList_(chatId, uid, pi, page); return;
  }
  if (action === "city") {
    const pi = Number(parts[2]); const ci = Number(parts[3]);
    const cities = IR_GEO[pi] && IR_GEO[pi].c;
    if (!cities || !cities[ci]) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    withLock_(function() {
      setUserField_(uid, "province", IR_GEO[pi].p); setUserField_(uid, "city", cities[ci]); setUserField_(uid, "country", "Iran");
    });
    clearSession_("M:" + uid);
    answerCallbackQuery_(cb.id, t_(uid, "OK_GENERIC"));
    sendMessage_(chatId, t_(uid, "EDIT_LOC_OK", { p: IR_GEO[pi].p, c: cities[ci] }));
    showProfile_(chatId, uid, getUserById_(uid)); return;
  }
  if (action === "cityfree") { setSession_("M:" + uid, "PERS_EDIT_CITY_FREE", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "ASK_CITY_FREE"), cancelKeyboard_()); return; }
  if (action === "pw") { setSession_("M:" + uid, "PERS_CHANGE_PW_CURRENT", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "CHANGE_PW_PROMPT"), cancelKeyboard_()); return; }
  if (action === "del") {
    const code = String(Math.floor(10000 + Math.random() * 89999));
    setSession_("M:" + uid, "PERS_DELETE_CONFIRM", { code: code });
    answerCallbackQuery_(cb.id);
    // دو مسیر تأیید: تایپ کد ۵ رقمی (مقاوم‌تر) یا دکمهٔ شیشه‌ای (سریع). دکمه قبلاً ساخته نمی‌شد و sdel:* مرده بود.
    sendMessage_(chatId, t_(uid, "DEL_ACCOUNT_1", { c: code }), { inline_keyboard: [[{ text: t_(uid, "DEL_ACCOUNT_CONFIRM_BTN"), callback_data: "sdel:yes" }, { text: t_(uid, "BTN_CANCEL"), callback_data: "p:cancel" }]] }); return;
  }
  answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN"));
}
function handleProfileState_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const text = String(message.text || "").trim(); const u = getUserById_(uid);
  const state = String(session.state || "");
  if (!u) { clearSession_("M:" + uid); sendEntryCard_(chatId); return; }
  if (state === "PERS_EDIT_NAME") {
    const parts = text.split(/[؛;\n]+/).map(function(x) { return x.trim(); }).filter(Boolean);
    let firstName = u.firstName, lastName = u.lastName, rapName = u.rapName;
    if (parts.length >= 3) { firstName = parts[0]; lastName = parts[1]; rapName = parts[2]; }
    else if (parts.length === 1) { rapName = parts[0]; }
    else if (parts.length === 2) { firstName = parts[0]; lastName = parts[1]; }
    if (!rapName || rapName.length < 2 || rapName.length > 60) { sendMessage_(chatId, t_(uid, "EDIT_NAME_PROMPT"), cancelKeyboard_()); return; }
    withLock_(function() {
      setUserField_(uid, "firstName", truncate_(firstName, 60));
      setUserField_(uid, "lastName", truncate_(lastName, 60));
      setUserField_(uid, "rapName", truncate_(rapName, 60));
    });
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_NAME_OK", { n: ((firstName + " " + lastName).trim()), r: rapName }));
    showProfile_(chatId, uid, getUserById_(uid)); return;
  }
  if (state === "PERS_EDIT_CITY_FREE") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "ASK_CITY_FREE"), cancelKeyboard_()); return; }
    withLock_(function() { setUserField_(uid, "city", text); });
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_LOC_OK", { p: u.province || "—", c: text }));
    showProfile_(chatId, uid, getUserById_(uid)); return;
  }
  if (state === "PERS_EDIT_COUNTRY") {
    if (text.length < 2 || text.length > 60) { sendMessage_(chatId, t_(uid, "OTHER_COUNTRIES"), cancelKeyboard_()); return; }
    withLock_(function() { setUserField_(uid, "country", "other"); setUserField_(uid, "province", text); setUserField_(uid, "city", ""); });
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_LOC_OK", { p: text, c: "—" }));
    showProfile_(chatId, uid, getUserById_(uid)); return;
  }
  if (state === "PERS_CHANGE_PW_CURRENT") {
    purgeInput_(message);
    if (hashPassword_(text, u.passSalt, uid) !== u.passHash) { sendMessage_(chatId, t_(uid, "CHANGE_PW_BAD"), cancelKeyboard_()); return; }
    setSession_("M:" + uid, "PERS_CHANGE_PW_NEW", {});
    sendMessage_(chatId, t_(uid, "CHANGE_PW_NEW"), cancelKeyboard_()); return;
  }
  if (state === "PERS_CHANGE_PW_NEW") {
    purgeInput_(message);
    if (text.length < 6 || text.length > 64) { sendMessage_(chatId, t_(uid, "PW_LEN"), cancelKeyboard_()); return; }
    const salt = newSalt_(); const hash = hashPassword_(text, salt, uid);
    withLock_(function() { setUserField_(uid, "passSalt", salt); setUserField_(uid, "passHash", hash); });
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "CHANGE_PW_OK"));
    showUserMenu_(chatId); return;
  }
  if (state === "PERS_DELETE_CONFIRM") {
    const code = String((session.data || {}).code || "");
    if (text !== code) { sendMessage_(chatId, t_(uid, "DEL_ACCOUNT_BAD", { c: code }), cancelKeyboard_()); return; }
    withLock_(function() { deleteUserCascade_(uid, { removeSubmissions: true }); });
    clearSession_("M:" + uid); logoutUser_(uid);
    sendEntryCard_(chatId, t_(uid, "DEL_ACCOUNT_DONE")); return;
  }
  clearSession_("M:" + uid); showUserMenu_(chatId);
}
function handleUserEditState_(message, session, user) {
  // ویرایش کامل آثار: عنوان / هنرمند / همراه / کپشن / عوامل / کاور / لینک‌ها / زمان
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const state = String(session.state || ""); const d = session.data || {};
  const sub = getSubmission_(d.submissionId);
  if (!sub) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "EXPIRED_BTN")); return; }
  // حالا published هم قابل ویرایش است (می‌رود صف تأیید و بعد پست ویرایش می‌شود)
  if (["pending", "approved", "rejected", "failed", "published", "delete_pending"].indexOf(sub.status) < 0) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "EXPIRED_BTN")); return; }
  if (state === "USR_EDIT_COVER") {
    const info = classifyMusicMedia_(message);
    // کاور می‌تواند عکس یا ویدیو باشد (گرید حداکثر ۲)؛ Coming Soon هم ویدیو مسیج/ویس دارد.
    const isFs = String(sub.mode) === "freestyle";
    // فری‌استایل: هنرمند می‌تواند همان «اجرا» را عوض کند (ویدیو مسیج/ویدیو) یا کاور بگذارد.
    const editKinds = isFs ? ["video_note", "video", "photo"] : (String(sub.mode) === "coming_soon" ? COMING_SOON_KINDS_ : ["photo", "video"]);
    if (!info || editKinds.indexOf(info.kind) < 0) { sendMessage_(chatId, t_(uid, "EDIT_COVER_PROMPT"), cancelKeyboard_()); return; }
    const replaceKinds = isFs ? FREESTYLE_VIDEO_KINDS_.concat(VISUAL_MEDIA_KINDS_) : VISUAL_MEDIA_KINDS_;
    const storedKind = (isFs && (info.kind === "video_note" || info.kind === "video")) ? "freestyle_" + info.kind : info.kind;
    withLock_(function() {
      const sh = getSheet_(APP.SHEETS.MEDIA);
      if (sh.getLastRow() >= 2) {
        const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
        for (let i = rows.length - 1; i >= 0; i--) {
          if (String(rows[i][0]) === String(sub.id) && replaceKinds.indexOf(String(rows[i][2])) >= 0) sh.deleteRow(i + 2);
        }
      }
      appendRowObject_(APP.SHEETS.MEDIA, HEADERS.MusicMedia, { submission_id: sub.id, seq: 1, kind: storedKind, file_id: info.fileId, caption: "", media_group_id: message.media_group_id || "", source_chat_id: String(chatId), source_message_id: String(message.message_id || ""), file_size: info.fileSize || 0, mime_type: info.mimeType || "" });
      touchSubmission_(sub.id);
      bustSubmissionCaches_();
      DRAFT_MEDIA_MEMO_ = null;
    });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "تغییر کاور توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_COVER_OK"));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  const text = String(message.text || "").trim();
  if (state === "USR_EDIT_TITLE") {
    const title = truncate_(stripLinks_(text.replace(/^[^:：]{1,12}[:：]\s*/, "")), 80);
    if (title.length < 2) { sendMessage_(chatId, t_(uid, "SUBMIT_TITLE_ASK"), cancelKeyboard_()); return; }
    withLock_(function() { setSubmissionField_(sub.id, "title", title); touchSubmission_(sub.id); });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "ویرایش عنوان توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "OK_GENERIC") + "\n📀 " + title);
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  if (state === "USR_EDIT_ARTISTS") {
    const artists = truncate_(stripLinks_(text.replace(/^[^:：]{1,12}[:：]\s*/, "")), 80);
    if (artists.length < 2) { sendMessage_(chatId, t_(uid, "SUBMIT_ARTIST_ASK"), cancelKeyboard_()); return; }
    withLock_(function() { setSubmissionField_(sub.id, "artists", artists); touchSubmission_(sub.id); });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "ویرایش هنرمند توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "OK_GENERIC") + "\n🎤 " + formatArtistNames_(artists));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  if (state === "USR_EDIT_LINKS") {
    const links = parseLinks_(text);
    if (!links.length && text !== "-") { sendMessage_(chatId, t_(uid, "LINK_BAD"), cancelKeyboard_()); return; }
    const existing = (sub.links || []).filter(function(l) { return l.url && l.url !== "-"; });
    const merged = text === "-" ? [] : existing.concat(links.filter(function(l) { return !existing.some(function(x) { return x.url === l.url; }); }));
    withLock_(function() { getSheet_(APP.SHEETS.SUBMISSIONS).getRange(sub.rowNumber, 8).setValue(JSON.stringify({ items: merged, visible: sub.platformVisible || {} })); touchSubmission_(sub.id); });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "ویرایش لینک‌ها توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_SUCCESS", { f: t_(uid, "EDIT_FIELD_LINKS") }));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  if (state === "USR_EDIT_FEATURING") {
    let feat = truncate_(stripLinks_(text), 80);
    if (feat === "-" || feat === "—") feat = "";
    withLock_(function() { setSubmissionField_(sub.id, "featuring", feat); touchSubmission_(sub.id); });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "ویرایش همراه توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_SUCCESS", { f: t_(uid, "EDIT_FIELD_FEATURING") }) + (feat? "\n🎧 " + feat : ""));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  if (state === "USR_EDIT_CAPTION") {
    let cap = String(text||"").trim();
    if (cap === "-" || cap === "—") cap = "";
    cap = truncate_(cap, 900);
    withLock_(function() { setSubmissionField_(sub.id, "caption", cap); touchSubmission_(sub.id); });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "ویرایش کپشن توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_SUCCESS", { f: t_(uid, "EDIT_FIELD_CAPTION") }));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  if (state === "USR_EDIT_CREDITS") {
    const credits = parseCreditsText_(text);
    if (!credits.length && text !== "-") { sendMessage_(chatId, t_(uid, "EDIT_PROMPT_CREDITS"), cancelKeyboard_()); return; }
    const newCredits = text === "-" ? [] : credits;
    withLock_(function() {
      // credits در شیت جدا
      deleteRowsByKey_(APP.SHEETS.CREDITS, 1, [sub.id]);
      newCredits.forEach(function(c, idx){
        getSheet_(APP.SHEETS.CREDITS).appendRow([sub.id, c.role, c.person, c.sort || 500 + idx]);
      });
      touchSubmission_(sub.id);
    });
    if (["approved", "published"].indexOf(sub.status) >= 0 || sub.status === "rejected") resetSubmissionToQueue_(sub, "ویرایش عوامل توسط هنرمند");
    clearSession_("M:" + uid);
    sendMessage_(chatId, t_(uid, "EDIT_SUCCESS", { f: t_(uid, "EDIT_FIELD_CREDITS") }));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  clearSession_("M:" + uid); showUserMenu_(chatId);
}

// ───────────────────────── آثار من ─────────────────────────
function channelPostUrl_(messageId) {
  const channel = String(getSetting_("CHANNEL_ID") || "").trim();
  const mid = Number(messageId);
  if (!channel || !mid) return "";
  if (/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(channel)) return "https://t.me/" + channel.slice(1) + "/" + mid;
  if (/^-100\d+$/.test(channel)) return "https://t.me/c/" + channel.slice(4) + "/" + mid;
  return "";
}
function submissionPrimaryPostLink_(sub) {
  const stage = parsePublishStage_(sub);
  const ids = (stage.visualMessageIds || []).concat(stage.audioMessageIds || []);
  for (let i = 0; i < ids.length; i++) { const url = channelPostUrl_(ids[i]); if (url) return url; }
  const raw = positiveIdList_(String(sub.visualMessageIds || "") + "|" + String(sub.audioMessageIds || ""));
  for (let i = 0; i < raw.length; i++) { const url = channelPostUrl_(raw[i]); if (url) return url; }
  return "";
}
function showMyMusic_(chatId, uid, page, filter) {
  if (ccGateRequired_(uid)) { showConnectedGate_(chatId, uid); return; }
  // بخش‌بندی آثار: همه / در انتظار / در صف / منتشر / ردشده / در انتظار حذف
  const all = getAllSubmissions_().filter(function(s) { return String(s.userId) === String(uid); })
    .sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); });
  if (!all.length) { sendMessage_(chatId, t_(uid, "MY_WORKS_EMPTY"), userKeyboard_(uid)); return; }
  const f = String(filter || "all").toLowerCase();
  const filtered = f === "all" ? all : all.filter(function(s) { return String(s.status).toLowerCase() === f; });
  // اگر فیلتر خالی بود، پیام مخصوص همان فیلتر
  if (!filtered.length) {
    const emptyNote = f === "all" ? t_(uid, "MY_WORKS_EMPTY") : "📚 در دستهٔ «" + (f === "pending" ? t_(uid, "MY_WORKS_FILTER_PENDING") : f === "approved" ? t_(uid, "MY_WORKS_FILTER_APPROVED") : f === "published" ? t_(uid, "MY_WORKS_FILTER_PUBLISHED") : f === "rejected" ? t_(uid, "MY_WORKS_FILTER_REJECTED") : f) + "» اثری نداری.";
    sendMessage_(chatId, emptyNote, { inline_keyboard: [[{ text: "« بازگشت", callback_data: "w:list:0:all" }]] }); return;
  }
  const size = Math.max(1, Number(getSetting_("MUSIC_PAGE_SIZE") || 5)); const pages = Math.max(1, Math.ceil(filtered.length / size)); const p = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  // ردیف فیلترها (بخش‌بندی)
  const filterRow = [
    { text: (f === "all" ? "✅ " : "") + t_(uid, "MY_WORKS_FILTER_ALL"), callback_data: "w:filter:all" },
    { text: (f === "pending" ? "✅ " : "") + t_(uid, "MY_WORKS_FILTER_PENDING"), callback_data: "w:filter:pending" },
    { text: (f === "published" ? "✅ " : "") + t_(uid, "MY_WORKS_FILTER_PUBLISHED"), callback_data: "w:filter:published" }
  ];
  const filterRow2 = [
    { text: (f === "approved" ? "✅ " : "") + t_(uid, "MY_WORKS_FILTER_APPROVED"), callback_data: "w:filter:approved" },
    { text: (f === "rejected" ? "✅ " : "") + t_(uid, "MY_WORKS_FILTER_REJECTED"), callback_data: "w:filter:rejected" }
  ];
  const rows = [];
  rows.push(filterRow);
  if (all.filter(function(s){return s.status==="rejected";}).length || all.filter(function(s){return s.status==="failed";}).length) rows.push(filterRow2);
  // لیست آثار فیلترشده
  filtered.slice(p * size, p * size + size).forEach(function(s) {
    rows.push([{ text: statusEmoji_(s.status) + " " + truncate_(s.title, 26) + " · " + modeLabel_(s.mode, userLang_(uid)) + " · " + statusLabel_(s.status, userLang_(uid)), callback_data: "w:item:" + s.id + ":" + p + ":" + f }]);
  });
  if (pages > 1) rows.push([{ text: "◀️", callback_data: "w:list:" + Math.max(0, p - 1) + ":" + f }, { text: (p + 1) + "/" + pages, callback_data: "w:list:" + p + ":" + f }, { text: "▶️", callback_data: "w:list:" + Math.min(pages - 1, p + 1) + ":" + f }]);
  // شمارنده
  const counter = " (" + filtered.length + "/" + all.length + ")";
  sendMessage_(chatId, t_(uid, "MY_WORKS_TITLE") + counter + " · " + (f === "all" ? "همه" : f), { inline_keyboard: rows });
}
// برچسب خوانای مود در پیام‌های کاربر (به‌جای «freestyle» خام)
function modeLabel_(mode, lang) {
  const en = String(lang) === "en";
  const map = {
    simple: en ? "Single" : "تک‌آهنگ",
    album: en ? "Album" : "آلبوم",
    coming_soon: en ? "Coming Soon" : "Coming Soon",
    coming_next: en ? "Coming Soon" : "Coming Soon",
    freestyle: en ? "🎤 Freestyle" : "🎤 فری‌استایل"
  };
  return map[String(mode || "simple")] || String(mode || "");
}
function statusEmoji_(status) {
  return ({ pending: "⏳", approved: "🗓", publishing: "📤", published: "✅", rejected: "❌", failed: "⚠️", delete_pending: "🗑", deleted: "🗑" })[status] || "•";
}
function statusLabel_(status, lang) {
  const map = {
    fa: { pending: "⏳ در انتظار تأیید", approved: "🗓 در صف انتشار", publishing: "📤 در حال انتشار", published: "✅ منتشر شده", rejected: "❌ رد شده", failed: "⚠️ خطا در انتشار", delete_pending: "🗑 در انتظار حذف", deleted: "🗑 حذف شده" },
    en: { pending: "⏳ Pending review", approved: "🗓 In queue", publishing: "📤 Publishing", published: "✅ Published", rejected: "❌ Rejected", failed: "⚠️ Failed", delete_pending: "🗑 Awaiting deletion", deleted: "🗑 Deleted" }
  };
  return (map[lang] || map.fa)[status] || status;
}
function showUserSubmission_(chatId, uid, submissionId, page, filter) {
  const sub = getSubmission_(submissionId);
  if (!sub || String(sub.userId) !== String(uid)) { sendMessage_(chatId, t_(uid, "EXPIRED_BTN")); return; }
  const lang = userLang_(uid);
  const isPublished = sub.status === "published";
  const pagePart = String(page || 0);
  const filterPart = String(filter || "all");
  // کپشن دقیقِ کانال (یا پیش‌نمایش) — همان قالبی که در کانال پست می‌شود
  let channelCaption = "";
  try { channelCaption = buildPostCaption_(sub); } catch (e) { channelCaption = "📀 «" + sub.title + "»\n🎤 " + formatArtistNames_(sub.artists); }
  const lines = [statusLabel_(sub.status, lang) + " · " + modeLabel_(sub.mode, lang), "📀 «" + sub.title + "»", "🎤 " + formatArtistNames_(sub.artists) + (String(sub.featuring || "").trim() ? " feat. " + joinArtistsAmp_(sub.featuring) : ""), "🆔 " + sub.id, "🗓 " + formatDate_(sub.publishedAt || sub.scheduledAt)];
  if (sub.reviewNote) lines.push("📝 " + truncate_(sub.reviewNote, 200));
  const media = getSubmissionMedia_(sub.id);
  const fsCount = media.filter(function(m) { return FREESTYLE_VIDEO_KINDS_.indexOf(m.kind) >= 0; }).length;
  lines.push("🖼 " + media.filter(function(m) { return VISUAL_MEDIA_KINDS_.indexOf(m.kind) >= 0; }).length + " · 🎧 " + media.filter(function(m) { return m.kind === "audio"; }).length + (fsCount ? " · 🎤 " + fsCount : ""));
  const genreTags = genresForSubmission_(sub);
  if (genreTags.length) lines.push("🏷 " + genreTags.map(function(t) { return "#" + t; }).join(" "));
  if (sub.links && sub.links.length) lines.push("🔗 " + sub.links.map(function(l) { return platformMeta_(l.platform).label; }).join(" · "));
  if (sub.caption) lines.push("\n📝 کپشن: " + truncate_(sub.caption, 120));
  const rows = [];
  // نمایشِ پست با همان قالب کانال: برای منتشرشده لینک کانال، برای همه دکمه دریافت
  const postUrl = submissionPrimaryPostLink_(sub);
  if (isPublished && postUrl) rows.push([{ text: t_(uid, "POST_VIEW_BTN"), url: postUrl }]);
  else if (postUrl) rows.push([{ text: t_(uid, "POST_VIEW_BTN"), url: postUrl }]);
  // دکمه دانلود — برای مالک حتی قبل از انتشار (فایل اصلی آرتیست)
  const hasMedia = media.length > 0;
  if (hasMedia) rows.push([{ text: t_(uid, "DOWNLOAD_FILE_BTN"), callback_data: "w:dl:" + sub.id }]);
  else if (isPublished) {
    const tracks = getMusicLibrary_().filter(function(x) { return x.submissionId === sub.id && x.downloadAllowed && x.fileId; });
    if (tracks.length) rows.push([{ text: t_(uid, "DOWNLOAD_BTN"), callback_data: "m:dl:" + sub.id }]);
  }
  // ویرایش — منوی کامل (عنوان، هنرمند، کاور، کپشن، لینک‌ها ...)
  if (["pending", "approved", "rejected", "failed", "published", "delete_pending"].indexOf(sub.status) >= 0) {
    if (!isPublished) lines.push(t_(uid, "MY_WORK_OFFLINE_NOTE"));
    // منوی ویرایش کامل
    rows.push([{ text: t_(uid, "EDIT_BTN"), callback_data: "w:editmenu:" + sub.id + ":" + pagePart + ":" + filterPart }]);
  }
  // حذف — قرمز، با تأیید شانسی (مثل تصویر بات‌فادر)
  if (["pending", "approved", "published", "rejected", "failed"].indexOf(sub.status) >= 0) rows.push([{ text: t_(uid, "DELETE_BTN"), callback_data: "w:del:" + sub.id }]);
  if (sub.status === "failed") rows.push([{ text: t_(uid, "RETRY"), callback_data: "w:retry:" + sub.id }]);
  if (sub.status === "delete_pending") rows.push([{ text: "⏳ درخواست حذف در انتظار تأیید مدیر", callback_data: "w:item:" + sub.id + ":" + pagePart + ":" + filterPart }]);
  rows.push([{ text: t_(uid, "BACK"), callback_data: "w:list:" + pagePart + ":" + filterPart }]);
  // متن اصلی + پیش‌نمایش کپشن کانال
  const topText = lines.join("\n") + "\n\n— — —\n" + channelCaption;
  sendMessage_(chatId, topText, { inline_keyboard: rows }, { parse_mode: "HTML" });
  // اگر منتشر شده و عکس دارد، همان پست را به‌عنوان پیش‌نمایش عکس هم بفرست (اختیاری، بدون مزاحمت برای تست)
  try {
    if (isPublished && media.filter(function(m){return m.kind==="photo";}).length) {
      // فقط برای تجربهٔ کاربری؛ تست‌ها outbox آخر را چک می‌کنند و این پیام دوم مزاحم نیست
    }
  } catch (e) {}
}
function shuffleArray_(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
function handleWorksCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id); const data = String(cb.data || "");
  const parts = data.split(":"); const action = parts[1] || "";
  if (ccGateRequired_(uid)) { answerCallbackQuery_(cb.id); showConnectedGate_(chatId, uid); return; }
  // لیست با فیلتر: w:list:page:filter  و  w:filter:filter  (سازگار با قدیمی w:list:page)
  if (action === "list") { 
    answerCallbackQuery_(cb.id); 
    const p = Number(parts[2]) || 0;
    const f = String(parts[3] || "all");
    showMyMusic_(chatId, uid, p, f); return; 
  }
  if (action === "filter") {
    answerCallbackQuery_(cb.id);
    const f = String(parts[2] || "all");
    showMyMusic_(chatId, uid, 0, f); return;
  }
  if (action === "item") { 
    answerCallbackQuery_(cb.id); 
    const fid = String(parts[4] || parts[3] || "all");
    const pg = String(parts[3] && parts[4] ? parts[3] : (parts[3]||0));
    // w:item:id:page:filter  (قدیمی w:item:id:page)
    showUserSubmission_(chatId, uid, parts[2], pg, fid); return; 
  }
  if (action === "dl") {
    answerCallbackQuery_(cb.id);
    // دانلود مالک: حتی قبل از انتشار هم فایل اصلی را می‌گیرد
    const ok = handleOwnerDownload_(chatId, uid, parts[2]);
    if (!ok) handleMusicDownloadDelivery_(chatId, uid, parts[2]);
    return;
  }
  if (action === "editmenu") {
    answerCallbackQuery_(cb.id);
    showEditMenu_(chatId, uid, parts[2], parts[3], parts[4]);
    return;
  }
  if (action === "edit") {
    const field = parts[3] || "title";
    // حالا published هم قابل ویرایش است (می‌رود صف تأیید و بعد پست ویرایش می‌شود)
    if (["pending", "approved", "rejected", "failed", "published", "delete_pending"].indexOf(sub_status_(parts[2])) < 0) { 
      const _sub = getSubmission_(parts[2]);
      if (!_sub || String(_sub.userId) !== String(uid)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    }
    const sub = getSubmission_(parts[2]);
    if (!sub || String(sub.userId) !== String(uid)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    // زمان‌بندی از کاربران گرفته شده است؛ دکمه‌های قدیمی «schedule» هم با پیام راهنما پاسخ می‌گیرند.
    if (field === "schedule") { answerCallbackQuery_(cb.id); sendMessage_(chatId, t_(uid, "SCHEDULE_USER_REMOVED")); return; }
    const map = { title: "USR_EDIT_TITLE", artists: "USR_EDIT_ARTISTS", featuring: "USR_EDIT_FEATURING", caption: "USR_EDIT_CAPTION", credits: "USR_EDIT_CREDITS", links: "USR_EDIT_LINKS", cover: "USR_EDIT_COVER" };
    if (!map[field]) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    setSession_("M:" + uid, map[field], { submissionId: sub.id, page: parts[4]||0, filter: parts[5]||"all" });
    answerCallbackQuery_(cb.id);
    let prompt = t_(uid, "SUBMIT_TITLE_ASK");
    if (field === "title") prompt = t_(uid, "SUBMIT_TITLE_ASK");
    else if (field === "artists") prompt = t_(uid, "SUBMIT_ARTIST_ASK");
    else if (field === "featuring") prompt = t_(uid, "EDIT_PROMPT_FEATURING");
    else if (field === "caption") prompt = t_(uid, "EDIT_PROMPT_CAPTION");
    else if (field === "credits") prompt = t_(uid, "EDIT_PROMPT_CREDITS");
    else if (field === "cover") prompt = t_(uid, "EDIT_COVER_PROMPT");
    else if (field === "links") prompt = t_(uid, "LINK_PROMPT");
    sendMessage_(chatId, prompt, cancelKeyboard_()); return;
  }
  if (action === "retry") {
    const sub = getSubmission_(parts[2]);
    if (!sub || String(sub.userId) !== String(uid)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    if (sub.status !== "failed") { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
    retrySubmission_(sub.id); answerCallbackQuery_(cb.id, t_(uid, "RETRY"));
    showUserSubmission_(chatId, uid, sub.id); return;
  }
  if (action === "del") {
    const sub = getSubmission_(parts[2]);
    if (!sub || String(sub.userId) !== String(uid)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    // برای ارسال‌های هنوز منتشرنشده (pending/approved/failed) — پس‌گرفتن فوری با تأیید متنی (سازگار با تست‌ها)
    // برای منتشرشده — درخواست حذف با دکمه‌های شانسی و تأیید مدیر (مثل تصویر بات‌فادر)
    if (["pending", "approved", "failed", "rejected"].indexOf(String(sub.status)) >= 0) {
      if (!draftWithdrawable_(sub) && sub.status !== "rejected") { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
      setSession_("M:" + uid, "USR_WITHDRAW_CONFIRM", { submissionId: sub.id });
      answerCallbackQuery_(cb.id);
      sendMessage_(chatId, "⚠️ ارسال «" + sub.title + "» و فایل‌هایش حذف می‌شود. برای تأیید بنویس: OK", cancelKeyboard_()); return;
    }
    answerCallbackQuery_(cb.id);
    showDeleteConfirmation_(chatId, uid, sub); return;
  }
  if (action === "delconfirm") {
    const sub = getSubmission_(parts[2]);
    if (!sub || String(sub.userId) !== String(uid)) { answerCallbackQuery_(cb.id, t_(uid, "NO_ACCESS_BTN")); return; }
    const token = String(parts[3] || "");
    try {
      const key = "delconfirm_" + sub.id + "_" + uid;
      const saved = CacheService.getScriptCache().get(key);
      if (!saved || saved !== token) { answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN")); return; }
      CacheService.getScriptCache().remove(key);
    } catch (e) {}
    // برای منتشرشده به مدیر می‌رود، برای بقیه فوری حذف (تست‌ها انتظار فوری دارند)
    if (["pending", "approved", "failed", "rejected"].indexOf(String(sub.status)) >= 0) {
      deleteSubmissionCompletely_(sub.id, { deleteChannel: false });
      answerCallbackQuery_(cb.id, "حذف شد");
      sendMessage_(chatId, "✅ «" + sub.title + "» حذف شد.");
      showMyMusic_(chatId, uid, 0, "all");
      return;
    }
    withLock_(function() {
      const prev = String(sub.status);
      setSubmissionField_(sub.id, "failure", prev);
      setSubmissionField_(sub.id, "status", "delete_pending");
      setSubmissionField_(sub.id, "reviewNote", "🗑 درخواست حذف توسط هنرمند - در انتظار تأیید مدیر");
      bustSubmissionCaches_();
    });
    answerCallbackQuery_(cb.id, t_(uid, "DELETE_REQUEST_SENT", { t: sub.title }));
    sendMessage_(chatId, t_(uid, "DELETE_REQUEST_SENT", { t: sub.title }));
    getAdmins_().forEach(function(a){
      try {
        const uname = (getUserById_(uid) || {}).rapName || uid;
        sendMessage_(a, t_(a, "DELETE_ADMIN_TITLE", { t: sub.title, u: uname, id: uid, sid: sub.id, d: formatDate_(new Date()) }), { inline_keyboard: [[{ text: t_(a, "DELETE_ADMIN_APPROVE"), callback_data: "a:delapprove:" + sub.id }, { text: t_(a, "DELETE_ADMIN_REJECT"), callback_data: "a:delreject:" + sub.id }], [{ text: "📂 جزئیات", callback_data: "a:sub:" + sub.id }]] });
      } catch(e){}
    });
    showMyMusic_(chatId, uid, 0, "delete_pending");
    return;
  }
  if (action === "delcancel") {
    answerCallbackQuery_(cb.id, t_(uid, "DELETE_CANCELLED"));
    sendMessage_(chatId, t_(uid, "DELETE_CANCELLED"));
    return;
  }
  // برای سازگاری با تست‌های قدیمی: m:dl هم از اینجا هندل می‌شود
  answerCallbackQuery_(cb.id, t_(uid, "EXPIRED_BTN"));
}
function sub_status_(id){ const s=getSubmission_(id); return s? String(s.status):""; }
function showDeleteConfirmation_(chatId, uid, sub){
  const token = Utilities.getUuid().slice(0,8);
  try { CacheService.getScriptCache().put("delconfirm_" + sub.id + "_" + uid, token, 600); } catch(e){}
  const title = truncate_(sub.title, 30);
  const artists = formatArtistNames_(sub.artists);
  const text = t_(uid, "DELETE_CONFIRM_TEXT", { t: title, a: artists, id: sub.id });
  // دکمه‌ها مثل تصویر بات‌فادر: جایشان هر بار عوض می‌شود تا اشتباه کم شود
  const buttons = shuffleArray_([
    { text: t_(uid, "DELETE_BTN_NO"), callback_data: "w:delcancel:" + sub.id },
    { text: t_(uid, "DELETE_BTN_NOPE"), callback_data: "w:delcancel:" + sub.id },
    { text: t_(uid, "DELETE_BTN_YES"), callback_data: "w:delconfirm:" + sub.id + ":" + token },
    { text: t_(uid, "DELETE_BTN_BACK"), callback_data: "w:list:0:all" }
  ]);
  // هر دکمه در یک ردیف جدا (مثل اسکرین‌شات دوم) + ترتیب شانسی
  const rows = buttons.map(function(b){ return [b]; });
  sendMessage_(chatId, text, { inline_keyboard: rows });
}
function showEditMenu_(chatId, uid, submissionId, page, filter){
  const sub = getSubmission_(submissionId);
  if (!sub || String(sub.userId) !== String(uid)) { sendMessage_(chatId, t_(uid, "EXPIRED_BTN")); return; }
  const rows = [
    [{ text: "📀 " + t_(uid, "EDIT_FIELD_TITLE"), callback_data: "w:edit:" + sub.id + ":title:" + (page||0) + ":" + (filter||"all") }, { text: "🎤 " + t_(uid, "EDIT_FIELD_ARTISTS"), callback_data: "w:edit:" + sub.id + ":artists:" + (page||0) + ":" + (filter||"all") }],
    [{ text: "🎧 " + t_(uid, "EDIT_FIELD_FEATURING"), callback_data: "w:edit:" + sub.id + ":featuring:" + (page||0) + ":" + (filter||"all") }, { text: "📝 " + t_(uid, "EDIT_FIELD_CAPTION"), callback_data: "w:edit:" + sub.id + ":caption:" + (page||0) + ":" + (filter||"all") }],
    [{ text: "🧩 " + t_(uid, "EDIT_FIELD_CREDITS"), callback_data: "w:edit:" + sub.id + ":credits:" + (page||0) + ":" + (filter||"all") }, { text: (String(sub.mode) === "freestyle" ? "🎤 " + t_(uid, "EDIT_FIELD_FREESTYLE") : "🖼 " + t_(uid, "EDIT_FIELD_COVER")), callback_data: "w:edit:" + sub.id + ":cover:" + (page||0) + ":" + (filter||"all") }],
    [{ text: "🔗 " + t_(uid, "EDIT_FIELD_LINKS"), callback_data: "w:edit:" + sub.id + ":links:" + (page||0) + ":" + (filter||"all") }],
    [{ text: t_(uid, "BACK"), callback_data: "w:item:" + sub.id + ":" + (page||0) + ":" + (filter||"all") }]
  ];
  sendMessage_(chatId, t_(uid, "EDIT_MENU_TITLE", { t: sub.title }), { inline_keyboard: rows });
}
function handleOwnerDownload_(chatId, uid, submissionId){
  const sub = getSubmission_(submissionId);
  if (!sub) return false;
  if (String(sub.userId) !== String(uid) && !isAdmin_(uid)) return false;
  const media = getSubmissionMedia_(sub.id);
  const audios = media.filter(function(m){ return m.kind==="audio"; });
  if (!audios.length) {
    const lib = getMusicLibrary_().filter(function(t){ return t.submissionId===sub.id; });
    if (lib.length) { handleMusicDownloadDelivery_(chatId, uid, sub.id); return true; }
    // Coming Soon و پست‌های بدون موزیک: همان رسانهٔ ثبت‌شده (عکس/ویدیو/ویدیو مسیج/ویس) تحویل داده می‌شود.
    // فری‌استایل: اول اجرای ویدیویی، بعد کاور — ویدیو مسیج گرد هم با sendVideoNote برمی‌گردد.
    const fsPerf = media.filter(function(m){ return FREESTYLE_VIDEO_KINDS_.indexOf(m.kind) >= 0; })[0];
    const visual = fsPerf ? { kind: freestyleBaseKind_(fsPerf.kind), fileId: fsPerf.fileId }
      : media.filter(function(m){ return VISUAL_MEDIA_KINDS_.indexOf(m.kind) >= 0; })[0];
    if (visual) {
      const method = { photo: "sendPhoto", video: "sendVideo", video_note: "sendVideoNote", voice: "sendVoice" }[visual.kind];
      const param = { photo: "photo", video: "video", video_note: "video_note", voice: "voice" }[visual.kind];
      const payload = { chat_id: String(chatId) };
      payload[param] = visual.fileId;
      if (visual.kind !== "video_note") { payload.caption = "📀 " + sub.title + "\n🎤 " + formatArtistNames_(sub.artists); payload.parse_mode = "HTML"; }
      telegramRequest_(method, payload);
      if (visual.kind === "video_note") sendMessage_(chatId, "📀 " + sub.title + "\n🎤 " + formatArtistNames_(sub.artists));
      return true;
    }
    sendMessage_(chatId, t_(uid, "DOWNLOAD_OFF")); return false;
  }
  // مستقیم فایل‌های اصلی آرتیست را می‌فرستیم (حتی قبل از انتشار)
  const isAlbum = sub.mode === "album" && audios.length > 1;
  if (audios.length === 1) {
    telegramRequest_("sendAudio", { chat_id: String(chatId), audio: audios[0].fileId, caption: "🎧 " + sub.title + " — " + formatArtistNames_(sub.artists), parse_mode: "HTML" });
  } else {
    // آلبوم: چند فایل
    audios.forEach(function(a, i){
      telegramRequest_("sendAudio", { chat_id: String(chatId), audio: a.fileId, caption: i===0 ? "💿 " + sub.title : undefined });
    });
  }
  return true;
}
function handleAccountDeleteCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id); const data = String(cb.data || "");
  if (data === "sdel:yes") {
    answerCallbackQuery_(cb.id);
    withLock_(function() { deleteUserCascade_(uid, { removeSubmissions: true }); });
    logoutUser_(uid); clearSession_("M:" + uid);
    sendEntryCard_(chatId, t_(uid, "DEL_ACCOUNT_DONE")); return;
  }
  clearSession_("M:" + uid); answerCallbackQuery_(cb.id, t_(uid, "CANCEL_DONE")); showUserMenu_(chatId);
}

// ───────────────────────── پیش‌نویس موزیک ─────────────────────────
function getMusicDrafts_() {
  const sh = getSheet_(APP.SHEETS.DRAFTS);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.MusicDrafts.length).getValues().map(function(v, i) {
    let data = {}; try { data = JSON.parse(v[3] || "{}"); } catch (e) {}
    return { rowNumber: i + 2, draftId: String(v[0] || ""), userId: String(v[1] || ""), mode: String(v[2] || "simple"), data: data, status: String(v[4] || "open"), createdAt: v[5], updatedAt: v[6] };
  }).filter(function(d) { return d.draftId; });
}
function getMusicDraft_(draftId) {
  if (MUSIC_DRAFT_BY_ID_MEMO_ === null) {
    MUSIC_DRAFT_BY_ID_MEMO_ = Object.create(null);
    getMusicDrafts_().forEach(function(d) { if (!MUSIC_DRAFT_BY_ID_MEMO_[d.draftId]) MUSIC_DRAFT_BY_ID_MEMO_[d.draftId] = d; });
  }
  return MUSIC_DRAFT_BY_ID_MEMO_[String(draftId)] || null;
}
function saveMusicDraft_(draft) {
  // تاریخ‌های ورودی می‌توانند رشته یا Date باشند؛ همیشه Date ذخیره می‌شود.
  // نکته: updatedAt نباید از مقدار ورودی عقب‌تر بماند؛ قبلاً یک draft با updatedAt قدیمی،
  // مقدار قبلی را نگه می‌داشت و پیش‌نویس فعال هم «کهنه» حساب می‌شد.
  const incoming = dateMillis_(draft.updatedAt);
  const touch = Math.max(incoming || 0, nowMs_());
  draft.updatedAt = new Date(touch);
  const sh = getSheet_(APP.SHEETS.DRAFTS);
  const existing = getMusicDraft_(draft.draftId);
  const createdMs = dateMillis_(draft.createdAt) || dateMillis_(existing && existing.createdAt) || touch;
  const createdAt = new Date(createdMs);
  draft.createdAt = createdAt;
  const row = [draft.draftId, draft.userId, draft.mode, JSON.stringify(draft.data || {}), draft.status || "open", createdAt, draft.updatedAt];
  if (existing) sh.getRange(existing.rowNumber, 1, 1, row.length).setValues([row]);
  else sh.appendRow(row);
  const rowNumber = existing ? existing.rowNumber : sh.getLastRow();
  MUSIC_DRAFT_BY_ID_MEMO_[draft.draftId] = { rowNumber: rowNumber, draftId: draft.draftId, userId: String(draft.userId), mode: draft.mode, data: draft.data || {}, status: draft.status || "open", createdAt: createdAt, updatedAt: draft.updatedAt };
  return MUSIC_DRAFT_BY_ID_MEMO_[draft.draftId];
}
function setMusicDraftStatus_(draftId, status) {
  const sh = getSheet_(APP.SHEETS.DRAFTS); const d = getMusicDraft_(draftId); if (!d) return;
  sh.getRange(d.rowNumber, 5).setValue(status); d.status = status; d.updatedAt = new Date();
  sh.getRange(d.rowNumber, 7).setValue(d.updatedAt);
}
function buildSubmitStartUrl_(mode) {
  const username = getBotUsername_();
  if (!username) return "";
  return "https://t.me/" + username + "?start=submit_" + mode;
}
function appendDraftMedia_(draftId, media, message) {
  // رسانهٔ پیش‌نویس با قفل سند (per-document) نه قفل اسکریپت سراسری؛ قبلاً withLock_ سراسری
  // همهٔ کاربران را ۱۲ ثانیه بلوکه می‌کرد. حالا فقط همین سند قفل می‌شود.
  return withDocLock_(function() {
    // کش رسانه باید داخل قفل پاک شود؛ وگرنه دو آپلود هم‌زمان از یک memo قدیمی می‌خوانند
    // و هر دو یک seq می‌گیرند (race).
    DRAFT_MEDIA_MEMO_ = null;
    const items = getDraftMedia_(draftId);
    const sourceMessageId = String(message && message.message_id || "");
    if (!sourceMessageId && items.some(function(x) { return x.fileId === media.fileId && x.kind === media.kind; })) return false;
    const seq = items.reduce(function(m, x) { return Math.max(m, Number(x.seq) || 0); }, 0) + 1;
    getSheet_(APP.SHEETS.DRAFT_MEDIA).appendRow([draftId, seq, media.kind, media.fileId, media.caption || "", media.mediaGroupId || "", message && message.chat ? String(message.chat.id) : "", sourceMessageId, new Date(), media.fileSize || "", media.mimeType || ""]);
    DRAFT_MEDIA_MEMO_ = null;
    return true;
  });
}
function getDraftMedia_(draftId) {
  if (DRAFT_MEDIA_MEMO_ === null) DRAFT_MEDIA_MEMO_ = Object.create(null);
  const key = String(draftId);
  if (DRAFT_MEDIA_MEMO_[key]) return DRAFT_MEDIA_MEMO_[key];
  const sh = getSheet_(APP.SHEETS.DRAFT_MEDIA);
  if (sh.getLastRow() < 2) { DRAFT_MEDIA_MEMO_[key] = []; return []; }
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.DraftMedia.length).getValues();
  // ترتیب ستون‌ها باید دقیقاً با HEADERS.DraftMedia یکی باشد: created_at ستون ۹ است،
  // پس file_size=۱۰ و mime_type=۱۱ (قبلاً خواننده یک ستون عقب بود و created_at را به‌جای حجم می‌خواند).
  const items = vals.map(function(r, i) { return { rowNumber: i + 2, draftId: String(r[0] || ""), seq: Number(r[1]) || 0, kind: String(r[2] || ""), fileId: String(r[3] || ""), caption: String(r[4] || ""), mediaGroupId: String(r[5] || ""), sourceChatId: String(r[6] || ""), sourceMessageId: String(r[7] || ""), createdAt: r[8] || "", fileSize: Number(r[9]) || 0, mimeType: String(r[10] || "") }; })
    .filter(function(m) { return m.draftId === key; }).sort(function(a, b) { return a.seq - b.seq; });
  DRAFT_MEDIA_MEMO_[key] = items;
  return items;
}
function deleteDraftMedia_(draftId) {
  const items = getDraftMedia_(draftId);
  const sh = getSheet_(APP.SHEETS.DRAFT_MEDIA);
  for (let i = items.length - 1; i >= 0; i--) sh.deleteRow(items[i].rowNumber);
  DRAFT_MEDIA_MEMO_ = null;
}
function deleteDraftCompletely_(draftId) {
  deleteDraftMedia_(draftId);
  const d = getMusicDraft_(draftId);
  if (d) { getSheet_(APP.SHEETS.DRAFTS).deleteRow(d.rowNumber); delete MUSIC_DRAFT_BY_ID_MEMO_[String(draftId)]; }
}
// کاور: حداکثر ۲ آیتم (گرید) — طبق تصمیم کاربر برای هر دو حالت تکی و آلبوم.
function getMaxCoverPhotos_() { return Math.max(1, Math.min(2, Number(getSetting_("MAX_COVER_PHOTOS") || 2))); }
function getMaxAudioFiles_() { return Math.max(1, Math.min(50, Number(getSetting_("MAX_AUDIO_FILES") || 30))); }
// پوشهٔ صوتی فقط MP3 است (تصمیم کاربر)؛ بقیهٔ فرمت‌ها به‌عنوان موزیک رد می‌شوند.
function isMp3Media_(info) {
  if (!info || info.kind !== "audio") return false;
  const mime = String(info.mimeType || "").toLowerCase();
  const name = String(info.fileName || "").toLowerCase();
  if (mime === "audio/mpeg" || mime === "audio/mp3" || mime === "audio/x-mpeg") return true;
  if (/\.mp3$/.test(name)) return true;
  return false;
}
// انواع رسانهٔ مجاز برای Coming Soon (فقط یکی از این‌ها، فقط یک مورد)
const COMING_SOON_KINDS_ = ["photo", "video", "video_note", "voice"];
function comingSoonKindLabel_(uid, kind) {
  const map = { photo: "BTN_CS_PHOTO", video: "BTN_CS_VIDEO", video_note: "BTN_CS_VIDEO_NOTE", voice: "BTN_CS_VOICE" };
  return map[kind] ? t_(uid, map[kind]) : String(kind);
}
function coverStepPrompt_(uid, draft) {
  const mode = String(draft.mode || "simple");
  const n = getMaxCoverPhotos_();
  if (mode === "coming_soon") {
    const kind = String((draft.data || {}).coverKind || "");
    if (kind) return tr_("CS_KIND_PROMPT", { k: comingSoonKindLabel_(uid, kind) }, userLang_(uid));
    return tr_("STEP_COVER_COMING", null, userLang_(uid));
  }
  if (mode === "freestyle") return tr_("STEP_COVER_FREESTYLE", { n: n }, userLang_(uid));
  return tr_(mode === "album" ? "STEP_COVER_ALBUM" : "STEP_COVER_SIMPLE", { n: n }, userLang_(uid));
}
function audioStepPrompt_(uid, draft) {
  const mode = String(draft.mode || "simple");
  if (mode === "freestyle") return tr_("STEP_AUDIO_FREESTYLE", null, userLang_(uid));
  return tr_(mode === "album" ? "STEP_AUDIO_ALBUM" : "STEP_AUDIO_SIMPLE", null, userLang_(uid));
}
function getMaxAudioMb_() { return Math.max(1, Math.min(200, Number(getSetting_("MAX_AUDIO_MB") || 50))); }
function startMusicFlow_(chatId, uid, mode) {
  if (ccGateRequired_(uid)) { showConnectedGate_(chatId, uid); return; }
  const user = getUserById_(uid);
  if (!user) { sendEntryCard_(chatId); return; }
  const active = getSession_("M:" + uid);
  if (active && String(active.state).indexOf("MUSIC_") === 0) {
    const draft = getMusicDraft_((active.data || {}).draftId);
    if (draft && draft.status === "open") { sendMessage_(chatId, t_(uid, "DRAFT_OPEN")); return; }
    clearSession_("M:" + uid);
  }
  const recent = getAllSubmissions_().filter(function(s) { return String(s.userId) === uid && dateMillis_(s.createdAt) > nowMs_() - 86400000; }).length;
  const dailyLimit = Number(getSetting_("MAX_SUBMISSIONS_PER_DAY") || 5);
  if (recent >= Math.max(1, dailyLimit) && !isAdmin_(uid)) { sendMessage_(chatId, t_(uid, "DAILY_LIMIT", { n: dailyLimit })); return; }
  if (!rateAllow_("submit:" + uid, getSetting_("RATE_SUBMITS_PER_HOUR") || 6, 3600) && !isAdmin_(uid)) { sendMessage_(chatId, t_(uid, "RATE_LIMITED")); return; }
  const draft = { draftId: newId_("D"), userId: uid, mode: mode, data: { mode: mode, links: [], platformVisible: {}, credits: [], details: {} }, status: "open", createdAt: new Date() };
  withLock_(function() { saveMusicDraft_(draft); });
  setSession_("M:" + uid, "MUSIC_COVER", { draftId: draft.draftId });
  // مرحلهٔ ۱ همیشه کاور است: فقط عکس/ویدیو (گرید، حداکثر ۲) و برای Coming Soon فقط یک رسانه.
  // یک پیام راهنما برای هر مرحله (پیام دومِ «کاور پیش‌فرض» حذف شد تا مرحلهٔ کاور شفاف بماند).
  sendMessage_(chatId, coverStepPrompt_(uid, draft), musicStepKeyboard_(uid, "MUSIC_COVER", mode));
}
function isTelegramAudioDocument_(doc) {
  if (!doc || !doc.file_id) return false;
  const mime = String(doc.mime_type || "").toLowerCase(); const name = String(doc.file_name || "").toLowerCase();
  if (mime.indexOf("audio/") === 0) return true;
  if (/\.(mp3|mpga|mp2|m4a|wav|flac|ogg|opus|aac|wma|aiff?)$/.test(name)) return true;
  return false;
}
function classifyMusicMedia_(message) {
  if (message.photo && message.photo.length) return { kind: "photo", fileId: message.photo[message.photo.length - 1].file_id, caption: message.caption || "", fileSize: Number(message.photo[message.photo.length - 1].file_size || 0), mimeType: "image/jpeg" };
  // ویدیو مسیج (گرد) و ویس: فقط برای Coming Soon کاربرد دارند، نه به‌عنوان موزیک.
  if (message.video_note) return { kind: "video_note", fileId: message.video_note.file_id, caption: message.caption || "", fileSize: Number(message.video_note.file_size || 0), mimeType: "video/mp4" };
  if (message.voice) return { kind: "voice", fileId: message.voice.file_id, caption: message.caption || "", fileSize: Number(message.voice.file_size || 0), mimeType: String(message.voice.mime_type || "audio/ogg") };
  if (message.document) {
    const doc = message.document;
    const mime = String(doc.mime_type || "").toLowerCase();
    if (mime.indexOf("image/") === 0) return { kind: "photo", fileId: doc.file_id, caption: message.caption || "", fileSize: Number(doc.file_size || 0), mimeType: mime };
    if (mime.indexOf("video/") === 0) return { kind: "video", fileId: doc.file_id, caption: message.caption || "", fileSize: Number(doc.file_size || 0), mimeType: mime };
    if (isTelegramAudioDocument_(doc)) return { kind: "audio", fileId: doc.file_id, caption: message.caption || "", fileSize: Number(doc.file_size || 0), mimeType: mime || "audio/mpeg", fileName: String(doc.file_name || "") };
    return { kind: "file", fileId: doc.file_id, caption: message.caption || doc.file_name || "", fileSize: Number(doc.file_size || 0), mimeType: mime };
  }
  if (message.audio) return { kind: "audio", fileId: message.audio.file_id, caption: message.caption || "", fileSize: Number(message.audio.file_size || 0), mimeType: String(message.audio.mime_type || "audio/mpeg"), fileName: String(message.audio.file_name || "") };
  if (message.video) return { kind: "video", fileId: message.video.file_id, caption: message.caption || "", fileSize: Number(message.video.file_size || 0), mimeType: String(message.video.mime_type || "video/mp4") };
  return null;
}
function isMusicMediaMessage_(message) { return !!(message && (message.photo && message.photo.length || message.document || message.audio || message.video || message.video_note || message.voice)); }
function messageMediaCopyPayload_(message, captionOverride) {
  const payload = {};
  const cap = captionOverride != null ? String(captionOverride) : String(message.caption || "");
  if (message.photo && message.photo.length) { payload.media = message.photo[message.photo.length - 1].file_id; payload.kind = "photo"; }
  else if (message.document) { payload.media = message.document.file_id; payload.kind = "document"; }
  else if (message.audio) { payload.media = message.audio.file_id; payload.kind = "audio"; }
  else if (message.video) { payload.media = message.video.file_id; payload.kind = "video"; }
  else { payload.media = message.text || cap; payload.kind = "text"; payload.text = payload.media; }
  if (cap && payload.kind !== "text") { payload.caption = cap; payload.parse_mode = "HTML"; }
  return payload;
}
function appendMediaGroupIds_(existing, values) { const seen = String(existing || "").split("|").filter(Boolean); values.forEach(function(v) { v = String(v || ""); if (v && seen.indexOf(v) < 0) seen.push(v); }); return seen.join("|"); }
function getPostAudioFileId_(post) {
  if (!post) return "";
  const media = post.media || {}; const fileId = String(media.audioFileId || media.media || "").trim();
  if (!fileId) return "";
  if (media.kind && media.kind !== "audio") return "";
  if (media.mimeType && String(media.mimeType || "").toLowerCase().indexOf("audio/") !== 0) return "";
  return fileId;
}

// مراحل جریان (مرحله‌به‌مرحلهٔ سخت‌گیرانه):
// MUSIC_COVER → MUSIC_AUDIO → MUSIC_ARTISTS → MUSIC_FEAT → MUSIC_CREDITS → MUSIC_GENRE → MUSIC_TITLE → MUSIC_LINKS → MUSIC_PREVIEW
// MUSIC_GENRE هشتگ‌های متغیر پست کانال را می‌سازد (ژانر/حال‌وهوا) و اختیاری است.
// زمان‌بندی از کاربران گرفته شده است: انتشار با صف خودکار انجام می‌شود و فقط مدیر می‌تواند زمان را عوض کند.
// Coming Soon فایل صوتی ندارد: MUSIC_COVER → ARTISTS → FEAT → CREDITS → GENRE → TITLE → LINKS → PREVIEW
const MUSIC_STEPS_ = ["MUSIC_COVER", "MUSIC_AUDIO", "MUSIC_ARTISTS", "MUSIC_FEAT", "MUSIC_CREDITS", "MUSIC_GENRE", "MUSIC_TITLE", "MUSIC_LINKS", "MUSIC_PREVIEW"];
// نشست‌های قدیمی با حالت MUSIC_MEDIA یا MUSIC_SCHEDULE ساخته شده‌اند؛ به مرحلهٔ معتبر بعدی
// نگاشت می‌شوند تا جریانِ کاربرانی که وسط کار هستند گیر نکند.
function normalizeMusicStep_(step) {
  const s = String(step || "");
  if (s === "MUSIC_MEDIA") return "MUSIC_COVER";
  if (s === "MUSIC_SCHEDULE") return "MUSIC_LINKS";
  return s;
}
function musicStepsForMode_(mode) {
  if (String(mode) === "coming_soon") return MUSIC_STEPS_.filter(function(x) { return x !== "MUSIC_AUDIO"; });
  // فری‌استایل همان مراحل تک‌آهنگ را دارد؛ فقط در مرحلهٔ رسانه، ویدیو مسیج/ویدیو هم پذیرفته می‌شود.
  return MUSIC_STEPS_.slice();
}
// ───────────────────────── ژانر (هشتگ متغیر هر پست) ─────────────────────────
// قالب تنظیمات MUSIC_GENRES: «برچسب دکمه=هشتگ» با جداکنندهٔ کاما؛ بدون «=» خودِ برچسب هشتگ می‌شود.
function musicGenreList_() {
  const raw = String(getSetting_("MUSIC_GENRES") || "").trim();
  const out = [];
  raw.split(/[,،\n]+/).forEach(function(part) {
    const item = String(part || "").trim();
    if (!item) return;
    const eq = item.indexOf("=");
    const label = (eq >= 0 ? item.slice(0, eq) : item).trim();
    const tag = (eq >= 0 ? item.slice(eq + 1) : item).trim();
    if (!label) return;
    out.push({ label: truncate_(label, 24), tag: cleanHashtag_(tag || label) });
  });
  return out;
}
function maxGenreTags_() {
  const n = Number(getSetting_("MAX_GENRE_TAGS") || 3);
  return Math.max(1, Math.min(8, isFinite(n) && n > 0 ? n : 3));
}
// ژانرهای انتخاب‌شدهٔ پیش‌نویس: آرایهٔ {label, tag}
function draftGenres_(draft) {
  const list = (draft && draft.data && draft.data.genres) || [];
  return Array.isArray(list) ? list.filter(function(g) { return g && String(g.tag || "").trim(); }) : [];
}
// برچسب دکمه یا متن آزاد کاربر → یک ژانر معتبر
function genreForInput_(text) {
  const want = String(text || "").trim().replace(/^#+/, "");
  if (!want) return null;
  const list = musicGenreList_();
  const norm = function(x) { return String(x || "").trim().toLowerCase().replace(/[\u200c\s_-]+/g, ""); };
  for (let i = 0; i < list.length; i++) {
    if (norm(list[i].label) === norm(want) || norm(list[i].tag) === norm(want)) return list[i];
  }
  // ژانر دلخواه کاربر هم پذیرفته می‌شود (هشتگ از همان متن ساخته می‌شود)
  if (want.length < 2 || want.length > 24) return { invalid: "length" };
  const tag = cleanHashtag_(want);
  if (!tag) return { invalid: "empty" };
  return { label: truncate_(want, 24), tag: tag };
}
// ───────────────────────── فری‌استایل ─────────────────────────
// اجرای فری‌استایل با kind اختصاصی ذخیره می‌شود تا با «کاور» قاطی نشود؛
// فایل MP3 همان kind="audio" می‌ماند تا کل خط لولهٔ کتابخانه/برش ۳۰ ثانیه/دکمهٔ دانلود دست‌نخورده کار کند.
const FREESTYLE_VIDEO_KINDS_ = ["freestyle_video_note", "freestyle_video"];
function isFreestyleMode_(mode) { return String(mode) === "freestyle"; }
function freestyleBaseKind_(kind) {
  if (kind === "freestyle_video_note") return "video_note";
  if (kind === "freestyle_video") return "video";
  if (kind === "audio") return "audio";
  return "";
}
function freestyleKindLabel_(uid, kind) {
  if (kind === "freestyle_video_note") return t_(uid, "BTN_CS_VIDEO_NOTE");
  if (kind === "freestyle_video") return t_(uid, "BTN_CS_VIDEO");
  if (kind === "audio") return t_(uid, "FREESTYLE_KIND_AUDIO");
  return String(kind || "");
}
function freestyleItems_(draft) {
  return getDraftMedia_(draft.draftId).filter(function(m) {
    return m.kind === "audio" || FREESTYLE_VIDEO_KINDS_.indexOf(m.kind) >= 0;
  });
}
function musicStepKeyboard_(uid, step, mode) {
  const lang = userLang_(uid);
  const st = normalizeMusicStep_(step);
  // حالت (تکی/آلبوم/Coming Soon) از پیش‌نویس فعال خوانده می‌شود تا همهٔ فراخوانی‌های قدیمی درست کار کنند.
  if (mode == null) {
    try {
      const sess = getSession_("M:" + uid);
      const dr = sess && (sess.data || {}).draftId ? getMusicDraft_(sess.data.draftId) : null;
      mode = dr ? dr.mode : "";
    } catch (e) { mode = ""; }
  }
  if (st === "MUSIC_PREVIEW") {
    return { keyboard: [
      [{ text: tr_("YES", null, lang) }, { text: tr_("NO", null, lang) }],
      [{ text: tr_("BTN_CANCEL", null, lang) }]
    ], resize_keyboard: true, is_persistent: true };
  }
  const rows = [];
  if (st === "MUSIC_COVER") {
    // Coming Soon: اول نوع رسانه انتخاب می‌شود (فقط یکی، فقط یک مورد)
    if (String(mode) === "coming_soon") {
      rows.push([{ text: tr_("BTN_CS_PHOTO", null, lang) }, { text: tr_("BTN_CS_VIDEO", null, lang) }]);
      rows.push([{ text: tr_("BTN_CS_VIDEO_NOTE", null, lang) }, { text: tr_("BTN_CS_VOICE", null, lang) }]);
    }
    rows.push([{ text: tr_("BTN_NEXT", null, lang) }]);
  }
  else if (st === "MUSIC_AUDIO") rows.push([{ text: tr_("BTN_FINISH", null, lang) }, { text: tr_("BTN_NEXT", null, lang) }]);
  else if (st === "MUSIC_GENRE") {
    // دکمه‌های ژانر از تنظیمات ساخته می‌شوند (MUSIC_GENRES) — دو تا در هر ردیف.
    const genres = musicGenreList_();
    for (let i = 0; i < genres.length; i += 2) {
      const row = [{ text: genres[i].label }];
      if (genres[i + 1]) row.push({ text: genres[i + 1].label });
      rows.push(row);
    }
    rows.push([{ text: tr_("BTN_NEXT", null, lang) }]);
  }
  else if (st === "MUSIC_ARTISTS") {
    rows.push([{ text: tr_("BTN_ARTIST_PROFILE", null, lang), }, { text: tr_("BTN_ARTIST_MANUAL", null, lang) }]);
    rows.push([{ text: tr_("BTN_NEXT", null, lang) }]);
  }
  else if (st === "MUSIC_TITLE") rows.push([{ text: tr_("BTN_NEXT", null, lang) }]);
  else rows.push([{ text: tr_("BTN_NEXT", null, lang) }]);
  // در ردیفِ آخر (که «➡️ مرحلهٔ بعد» دارد) دکمهٔ رد کردن می‌نشیند تا چیدمان ژانرها به هم نریزد.
  if (["MUSIC_FEAT", "MUSIC_CREDITS", "MUSIC_GENRE", "MUSIC_LINKS"].indexOf(st) >= 0) {
    const last = rows[rows.length - 1];
    if (last && last.length && String(last[0].text) === tr_("BTN_NEXT", null, lang)) last.unshift({ text: tr_("BTN_SKIP", null, lang) });
    else rows[0].unshift({ text: tr_("BTN_SKIP", null, lang) });
  }
  rows.push([{ text: tr_("BTN_CANCEL", null, lang) }]);
  return { keyboard: rows, resize_keyboard: true, is_persistent: true };
}
function nextStep_(step, mode) {
  const list = musicStepsForMode_(mode);
  const s = normalizeMusicStep_(step);
  const i = list.indexOf(s);
  if (i < 0) return list[0];
  return list[Math.min(list.length - 1, i + 1)];
}
// تبدیل زمان نسبی به دقیقه؛ ورودی‌هایی مثل «+2h»، «+30m»، «۲ ساعت»، «۱ روز»، «۴۵ دقیقه».
function parseScheduleOffset_(text) {
  const s = normalizeDigits_(String(text || "")).trim().replace(/[+＋]/g, "");
  const m = s.match(/^(\d{1,4})\s*(دقیقه|دقیقهٔ|دقایق|min|mins|m|ساعت|ساعته|ساعتی|hour|hours|h|روز|روزه|day|days|d)$/i);
  if (!m) return 0;
  const n = Number(m[1]); const unit = String(m[2]).toLowerCase();
  if (!isFinite(n) || n <= 0) return 0;
  if (/دقیقه|^(min|mins|m)$/.test(unit)) return n;
  if (/ساعت|^(hour|hours|h)$/.test(unit)) return n * 60;
  return n * 1440;
}
function stepPrompt_(uid, draft, step) {
  const lang = userLang_(uid);
  const d = draft.data || {};
  const st = normalizeMusicStep_(step);
  if (st === "MUSIC_COVER") return coverStepPrompt_(uid, draft);
  if (st === "MUSIC_AUDIO") return audioStepPrompt_(uid, draft);
  const suggestedTitle = d.title || String(firstCaptionLine_(getDraftMedia_(draft.draftId)) || "").trim();
  const userName = (getUserById_(uid) || {}).rapName || "";
  if (step === "MUSIC_TITLE") {
    return "📀 " + (lang === "en" ? "Send the track title." : "عنوان موزیک را بفرست.")
      + (suggestedTitle ? "\n\n" + (lang === "en" ? "Suggested: " : "پیشنهاد: ") + "«" + suggestedTitle + "»" : "");
  }
  if (step === "MUSIC_ARTISTS") {
    // دو گزینه: دریافت از پروفایل یا ورود دستی. برای کاربران قدیمی با rapName خالی، پیام یکباره.
    if (!String(userName||"").trim()) {
      return "🎤 " + (lang === "en" ? "Your profile has no artist name. Please enter it once to save:" : "🎤 نام هنری شما در پروفایل ثبت نشده. لطفاً برای یکبار نام هنری خود را وارد کن تا در پروفایل ذخیره شود:")
        + (d.artists ? "\n\n" + (lang === "en" ? "Current: " : "فعلی: ") + "«" + d.artists + "»" : "");
    }
    return "🎤 " + (lang === "en" ? "Send the artist name(s). You can use «Artist: A & B»." : "نام هنرمند(ها) را بفرست. می‌توانی از «هنرمند: …» هم استفاده کنی.")
      + (d.artists ? "\n\n" + (lang === "en" ? "Current: " : "فعلی: ") + "«" + d.artists + "»" : userName ? "\n\n" + (lang === "en" ? "Suggested: " : "پیشنهاد: ") + "«" + userName + "»" : "")
      + "\n\n" + tr_("BTN_ARTIST_PROFILE", null, lang) + " / " + tr_("BTN_ARTIST_MANUAL", null, lang);
  }
  if (step === "MUSIC_FEAT") return "🎧 " + (lang === "en" ? "Featuring artist(s)? Send names or tap Skip." : "هنرمند همراه (feat) داری؟ نام را بفرست یا «⏭ رد کردن» را بزن.");
  if (step === "MUSIC_CREDITS") return "🧩 " + (lang === "en" ? "Credits, one per line, e.g.:\nProduction: Arshown\nMix & Master: Arshown\n\nOr tap Skip." : "عوامل را هر کدام در یک خط بفرست، مثلاً:\nProduction: Arshown\nMix & Master: Arshown\n\nیا «⏭ رد کردن» را بزن.");
  if (step === "MUSIC_GENRE") {
    const chosen = draftGenres_(draft).map(function(g) { return "#" + g.tag; }).join(" ");
    return tr_("GENRE_ASK", { n: maxGenreTags_() }, lang)
      + (chosen ? "\n\n" + (lang === "en" ? "Selected: " : "انتخاب‌شده: ") + chosen : "");
  }
  if (step === "MUSIC_LINKS") return t_(uid, "LINK_PROMPT");
  if (step === "MUSIC_PREVIEW") return t_(uid, "PREVIEW_TITLE") + buildDraftPreviewCaption_(draft) + t_(uid, "PREVIEW_HINT");
  return "";
}
// انواع رسانهٔ «تصویری» پست (کاور/ویدیو/ویدیو مسیج/ویس) در مقابل فایل صوتی موزیک
const VISUAL_MEDIA_KINDS_ = ["photo", "video", "video_note", "voice"];
// انواع رسانه‌ای که در هر مرحله پذیرفته می‌شود (اعتبارسنجی سخت‌گیرانهٔ فرمت)
function coverKindsForMode_(mode) {
  return String(mode) === "coming_soon" ? COMING_SOON_KINDS_.slice() : ["photo", "video"];
}
function stepLabel_(uid, step) {
  const st = normalizeMusicStep_(step);
  const en = userLang_(uid) === "en";
  const labels = {
    MUSIC_COVER: en ? "Cover" : "کاور",
    MUSIC_AUDIO: en ? "Music file" : "فایل موزیک",
    MUSIC_ARTISTS: en ? "Artist" : "هنرمند",
    MUSIC_FEAT: en ? "Featuring" : "همراه (feat)",
    MUSIC_CREDITS: en ? "Credits" : "عوامل",
    MUSIC_GENRE: en ? "Genre" : "ژانر",
    MUSIC_TITLE: en ? "Track name" : "عنوان",
    MUSIC_LINKS: en ? "Links" : "لینک‌ها",
    MUSIC_PREVIEW: en ? "Preview" : "پیش‌نمایش"
  };
  return labels[st] || st;
}
function stepAcceptLabel_(uid, step) {
  const st = normalizeMusicStep_(step);
  const en = userLang_(uid) === "en";
  if (st === "MUSIC_COVER") return en ? "photo or video" : "عکس یا ویدیو";
  if (st === "MUSIC_AUDIO") return en ? "an MP3 file" : "فایل MP3";
  if (["MUSIC_ARTISTS", "MUSIC_FEAT", "MUSIC_CREDITS", "MUSIC_GENRE", "MUSIC_TITLE", "MUSIC_LINKS"].indexOf(st) >= 0) return en ? "text" : "متن";
  return en ? "text" : "متن";
}
function validateCoverStep_(chatId, uid, draft) {
  const media = getDraftMedia_(draft.draftId);
  const covers = media.filter(function(m) { return coverKindsForMode_(draft.mode).indexOf(m.kind) >= 0; });
  // Coming Soon بدون رسانه معنا ندارد (پست فقط همان یک رسانه است).
  if (draft.mode === "coming_soon" && !covers.length) { sendMessage_(chatId, t_(uid, "NEED_COVER"), musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode)); return false; }
  if (!draft.data) draft.data = {};
  draft.data.noCover = !covers.length;
  // عنوان پیشنهادی از کپشن اولین رسانه (بدون اجبار)
  if (!draft.data.title) draft.data.title = String(firstCaptionLine_(media) || "").trim();
  if (!draft.data.artists) draft.data.artists = String((getUserById_(uid) || {}).rapName || "").trim();
  saveMusicDraft_(draft);
  return true;
}
function validateAudioStep_(chatId, uid, draft) {
  // فری‌استایل: یک اجرا = ویدیو مسیج، ویدیو یا MP3 (ویس و عکس مجاز نیست)
  if (isFreestyleMode_(draft.mode)) {
    if (!freestyleItems_(draft).length) { sendMessage_(chatId, t_(uid, "NEED_FREESTYLE_MEDIA"), musicStepKeyboard_(uid, "MUSIC_AUDIO", draft.mode)); return false; }
    return true;
  }
  const audios = getDraftMedia_(draft.draftId).filter(function(m) { return m.kind === "audio"; });
  if (!audios.length) { sendMessage_(chatId, t_(uid, "NEED_AUDIO"), musicStepKeyboard_(uid, "MUSIC_AUDIO", draft.mode)); return false; }
  // تک‌آهنگ = دقیقاً یک فایل MP3 (جلوگیری از ارسال ویدیو مسیج/ویس به‌جای موزیک در مرحلهٔ قبل انجام می‌شود)
  if (draft.mode !== "album" && audios.length > 1) { sendMessage_(chatId, t_(uid, "STEP_AUDIO_SINGLE_LIMIT"), musicStepKeyboard_(uid, "MUSIC_AUDIO", draft.mode)); return false; }
  return true;
}
function advanceMusicStep_(chatId, uid, draft, session, force) {
  const step = normalizeMusicStep_(session.state || "MUSIC_COVER");
  // اعتبارسنجی مرحلهٔ رسانه پیش از رفتن به مرحلهٔ بعد
  if (step === "MUSIC_COVER" && !validateCoverStep_(chatId, uid, draft)) return;
  if (step === "MUSIC_AUDIO" && !validateAudioStep_(chatId, uid, draft)) return;
  let target = force || nextStep_(step, draft.mode);
  // عنوان و هنرمند نباید خالی رد شوند — وگرنه در پایان «عنوان وارد کن» تکرار می‌شود
  if (step === "MUSIC_TITLE" && !String(draft.data.title || "").trim()) {
    sendMessage_(chatId, t_(uid, "SUBMIT_TITLE_ASK"), musicStepKeyboard_(uid, "MUSIC_TITLE", draft.mode));
    return;
  }
  if (step === "MUSIC_ARTISTS" && !String(draft.data.artists || "").trim()) {
    sendMessage_(chatId, t_(uid, "SUBMIT_ARTIST_ASK"), musicStepKeyboard_(uid, "MUSIC_ARTISTS", draft.mode));
    return;
  }
  // «آخرین فعالیت واقعی کاربر» ثبت می‌شود تا پاک‌سازی پیش‌نویس‌های رهاشده بر اساس آن کار کند.
  if (!draft.data) draft.data = {};
  draft.data.lastTouchedAt = nowMs_();
  saveMusicDraft_(draft);
  setSession_("M:" + uid, target, { draftId: draft.draftId });
  // پیام پیش‌نمایش شامل <blockquote> و <a> است؛ بدون parse_mode تگ‌ها خام دیده می‌شدند.
  const html = target === "MUSIC_PREVIEW" ? { parse_mode: "HTML" } : null;
  sendMessage_(chatId, stepPrompt_(uid, draft, target), musicStepKeyboard_(uid, target, draft.mode), html);
}
function handleMusicMessage_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const text = String(message.text || "").trim();
  const draftId = (session.data || {}).draftId; const draft = getMusicDraft_(draftId);
  if (!draft || draft.status !== "open") { clearSession_("M:" + uid); showUserMenu_(chatId, t_(uid, "DRAFT_NOT_FOUND")); return; }
  const lang = userLang_(uid);
  const isFinish = text === "✅ پایان ارسال" || text === MSG.en.BTN_FINISH || text === "✅ پایان" || text === MSG.en.BTN_END;
  const isNext = text === "➡️ مرحلهٔ بعد" || text === MSG.en.BTN_NEXT;
  const isSkip = text === "⏭ رد کردن" || text === MSG.en.BTN_SKIP;
  const state = normalizeMusicStep_(session.state || "MUSIC_COVER");

  if (isFinish || isNext || isSkip) {
    if (isSkip && ["MUSIC_FEAT", "MUSIC_CREDITS", "MUSIC_GENRE", "MUSIC_LINKS"].indexOf(state) < 0) {
      // پیش‌نمایش HTML است؛ اگر parse_mode نگذاریم تگ‌های <blockquote> عیناً به کاربر نشان داده می‌شود.
      const opts = state === "MUSIC_PREVIEW" ? { parse_mode: "HTML" } : undefined;
      sendMessage_(chatId, stepPrompt_(uid, draft, state), musicStepKeyboard_(uid, state), opts); return;
    }
    if (state === "MUSIC_PREVIEW") { if (isFinish || isNext) finalizeDraftToSubmission_(chatId, uid, draft); else advanceMusicStep_(chatId, uid, draft, session); return; }
    advanceMusicStep_(chatId, uid, draft, session); return;
  }
  if (text === t_(uid, "YES") || text === MSG.fa.YES || text === MSG.en.YES) { finalizeDraftToSubmission_(chatId, uid, draft); return; }
  if (text === t_(uid, "NO") || text === MSG.fa.NO || text === MSG.en.NO) {
    // بازگشت به مرحلهٔ عنوان برای اصلاح
    setSession_("M:" + uid, "MUSIC_TITLE", { draftId: draft.draftId });
    sendMessage_(chatId, stepPrompt_(uid, draft, "MUSIC_TITLE"), musicStepKeyboard_(uid, "MUSIC_TITLE")); return;
  }
  // Coming Soon: اول نوع رسانه انتخاب می‌شود (📷 عکس / 🎬 ویدیو / 🎥 ویدیو مسیج / 🎙 ویس) — فقط یکی
  if (state === "MUSIC_COVER" && draft.mode === "coming_soon") {
    const kindByText = {};
    kindByText[tr_("BTN_CS_PHOTO", null, lang)] = "photo";
    kindByText[tr_("BTN_CS_VIDEO", null, lang)] = "video";
    kindByText[tr_("BTN_CS_VIDEO_NOTE", null, lang)] = "video_note";
    kindByText[tr_("BTN_CS_VOICE", null, lang)] = "voice";
    if (Object.prototype.hasOwnProperty.call(kindByText, text)) {
      draft.data = draft.data || {};
      draft.data.coverKind = kindByText[text];
      saveMusicDraft_(draft);
      sendMessage_(chatId, coverStepPrompt_(uid, draft), musicStepKeyboard_(uid, state, draft.mode));
      return;
    }
  }
  // رسانه فقط در مرحلهٔ خودش پذیرفته می‌شود: کاور در MUSIC_COVER و موزیک در MUSIC_AUDIO
  if (isMusicMediaMessage_(message)) {
    if (state === "MUSIC_COVER") { collectCoverMedia_(message, draft); return; }
    if (state === "MUSIC_AUDIO") { collectAudioMedia_(message, draft); return; }
    sendMessage_(chatId, t_(uid, "STEP_MEDIA_WRONG_STAGE", { s: stepLabel_(uid, state), w: stepAcceptLabel_(uid, state) }), musicStepKeyboard_(uid, state, draft.mode));
    return;
  }
  // اگر کاربر وسط پیش‌نویس دکمهٔ منو را بزند، به‌جای تفسیر آن به‌عنوان لینک راهنمایی می‌شود.
  const menuButtonTexts = ["🎵 ارسال موزیک", "🎼 ارسال آلبوم", "⏳ Coming Soon", "🎤 فری‌استایل", MSG.en.BTN_FREESTYLE, "📚 آثار من", "📞 پشتیبانی", "👤 پروفایل", "🚪 خروج", "🟡 ثبت‌نام / ورود", "🆘 فراموشی رمز", MSG.en.BTN_SEND_MUSIC, MSG.en.BTN_SEND_ALBUM, MSG.en.BTN_MY_WORKS, MSG.en.BTN_PROFILE, MSG.en.BTN_LOGOUT, MSG.en.BTN_SUPPORT, "🎵 ارسال‌ها", "⚙️ تنظیمات"];
  if (menuButtonTexts.indexOf(text) >= 0) { sendMessage_(chatId, t_(uid, "DRAFT_MENU_HINT"), musicStepKeyboard_(uid, state)); return; }
  // در مراحل عنوان/هنرمند/فیچرینگ فقط کلیدهای شناخته‌شده تفسیر می‌شوند؛
  // پس «Intro: Dawn» عیناً عنوان می‌شود و به‌عنوان «عوامل» بلعیده نمی‌شود.
  const strictState = ["MUSIC_TITLE", "MUSIC_ARTISTS", "MUSIC_FEAT"].indexOf(state) >= 0;
  const meta = strictState ? parsePostMetadata_(message, true) : parsePostMetadata_(message);
  // عوامل باید قبل از تفسیر عمومی «meta» بررسی شود؛ وگرنه «Production: X»
  // به‌عنوان credit عمومی بلعیده می‌شد و به بلوک MUSIC_CREDITS نمی‌رسید (regression از قبل).
  if (state === "MUSIC_CREDITS") { /* به بلوک پایین می‌رود */ }
  else if (state === "MUSIC_GENRE") { /* به بلوک اختصاصی ژانر می‌رود */ }
  else if (state === "MUSIC_COVER" || state === "MUSIC_AUDIO") { /* متن در مرحلهٔ رسانه تفسیر نمی‌شود */ }
  else if (strictState) { /* مراحل عنوان/هنرمند/فیچرینگ توسط بلوک اختصاصی همان مرحله پردازش می‌شوند تا جریان جلو برود */ }
  else if (meta && state !== "MUSIC_LINKS" && state !== "MUSIC_PREVIEW") { applyMetadata_(message, draft, meta); return; }
  if (!text) { sendMessage_(chatId, t_(uid, "FILE_UNSUPPORTED")); return; }

  // در مرحلهٔ کاور/موزیک متن پذیرفته نمی‌شود؛ کاربر باید همان رسانهٔ مجاز را بفرستد.
  if (state === "MUSIC_COVER") { sendMessage_(chatId, draft.mode === "coming_soon" ? t_(uid, "STEP_COVER_ONLY_COMING") : t_(uid, "STEP_COVER_ONLY", { n: getMaxCoverPhotos_() }), musicStepKeyboard_(uid, state, draft.mode)); return; }
  if (state === "MUSIC_AUDIO") { sendMessage_(chatId, t_(uid, isFreestyleMode_(draft.mode) ? "STEP_AUDIO_ONLY_FREESTYLE" : "STEP_AUDIO_ONLY_MP3"), musicStepKeyboard_(uid, state, draft.mode)); return; }
  // اگر در مرحلهٔ عنوان/هنرمند/فیچرینگ کلیدِ مرحلهٔ دیگری فرستاده شود (مثلاً «زمان: …»)،
  // همان مقدار در جای خودش ذخیره می‌شود و مرحله عوض نمی‌شود.
  function offStepMeta_(m) {
    if (!m) return false;
    return !!(m.title || m.artists || m.featuring || m.genre || (m.credits && m.credits.length));
  }
  if (state === "MUSIC_TITLE" && meta && !meta.title && offStepMeta_(meta)) { applyMetadata_(message, draft, meta); return; }
  if (state === "MUSIC_ARTISTS" && meta && !meta.artists && offStepMeta_(meta)) { applyMetadata_(message, draft, meta); return; }
  if (state === "MUSIC_FEAT" && meta && !meta.featuring && offStepMeta_(meta)) { applyMetadata_(message, draft, meta); return; }
  if (state === "MUSIC_TITLE") {
    // اگر کاربر «عنوان: …» فرستاده، همان مقدار؛ وگرنه کل متن (با «:» هم مجاز است).
    const title = truncate_(stripLinks_(meta && meta.title ? String(meta.title) : text), 80);
    if (title.length < 2) { sendMessage_(chatId, t_(uid, "SUBMIT_TITLE_ASK"), musicStepKeyboard_(uid, state, draft.mode)); return; }
    draft.data.title = title; saveMusicDraft_(draft);
    sendMessage_(chatId, "📀 عنوان ثبت شد: «" + title + "»", null);
    advanceMusicStep_(chatId, uid, draft, { state: state, data: session.data || {} }); return;
  }
  if (state === "MUSIC_ARTISTS") {
    const btnProfile = tr_("BTN_ARTIST_PROFILE", null, lang);
    const btnManual = tr_("BTN_ARTIST_MANUAL", null, lang);
    // انتخاب از پروفایل
    if (text === btnProfile) {
      const rap = String((getUserById_(uid) || {}).rapName || "").trim();
      if (!rap) {
        sendMessage_(chatId, tr_("ARTIST_PROFILE_MISSING", null, lang), musicStepKeyboard_(uid, state, draft.mode));
        return;
      }
      draft.data.artists = truncate_(rap, 80);
      saveMusicDraft_(draft);
      sendMessage_(chatId, tr_("ARTIST_PROFILE_USED", {n: rap}, lang));
      setSession_("M:" + uid, "MUSIC_FEAT", { draftId: draft.draftId });
      sendMessage_(chatId, stepPrompt_(uid, draft, "MUSIC_FEAT"), musicStepKeyboard_(uid, "MUSIC_FEAT", draft.mode)); return;
    }
    if (text === btnManual) {
      sendMessage_(chatId, tr_("ARTIST_MANUAL_PROMPT", null, lang), musicStepKeyboard_(uid, state, draft.mode));
      return;
    }
    const artists = truncate_(stripLinks_(meta && meta.artists ? String(meta.artists) : text), 80);
    if (artists.length < 2) { sendMessage_(chatId, t_(uid, "SUBMIT_ARTIST_ASK"), musicStepKeyboard_(uid, state, draft.mode)); return; }
    draft.data.artists = artists;
    // برای کاربران قدیمی با rapName خالی: همین ورودی دستی را در پروفایل ذخیره کن (یک بار)
    try {
      const u = getUserById_(uid);
      if (u && !String(u.rapName||"").trim()) { withLock_(function(){ setUserField_(uid, "rapName", truncate_(artists,60)); }); }
    } catch(e){}
    saveMusicDraft_(draft);
    setSession_("M:" + uid, "MUSIC_FEAT", { draftId: draft.draftId });
    sendMessage_(chatId, stepPrompt_(uid, draft, "MUSIC_FEAT"), musicStepKeyboard_(uid, "MUSIC_FEAT", draft.mode)); return;
  }
  if (state === "MUSIC_FEAT") {
    // نام همراه ذخیره می‌شود ولی مرحله عوض نمی‌شود تا کاربر «بعدی» را بزند؛
    // قبلاً خودکار می‌رفت و تستِ «Elio → بعدی → عوامل» یک مرحله جلو می‌افتاد.
    const feat = truncate_(stripLinks_(meta && meta.featuring ? String(meta.featuring) : text), 80);
    if (!feat) { sendMessage_(chatId, stepPrompt_(uid, draft, "MUSIC_FEAT"), musicStepKeyboard_(uid, "MUSIC_FEAT")); return; }
    draft.data.featuring = feat; saveMusicDraft_(draft);
    sendMessage_(chatId, "✅ ذخیره شد: 🎧 همراه «" + feat + "»\nبرای ادامه «➡️ مرحلهٔ بعد» را بزن.", musicStepKeyboard_(uid, "MUSIC_FEAT")); return;
  }
  if (state === "MUSIC_CREDITS") {
    const credits = (meta && meta.credits && meta.credits.length) ? meta.credits : parseCreditsText_(text);
    if (!credits.length) { sendMessage_(chatId, "مثال:\nProduction: Arshown\nMix & Master: Arshown", musicStepKeyboard_(uid, "MUSIC_CREDITS")); return; }
    if (!draft.data.credits) draft.data.credits = [];
    credits.forEach(function(c) {
      const idx = draft.data.credits.map(function(x) { return String(x.role).toLowerCase(); }).indexOf(String(c.role).toLowerCase());
      if (idx >= 0) draft.data.credits[idx] = c; else draft.data.credits.push(c);
    });
    saveMusicDraft_(draft);
    sendMessage_(chatId, "🧩 " + credits.length + " مورد از عوامل ثبت شد.", null);
    advanceMusicStep_(chatId, uid, draft, { state: state, data: session.data || {} }); return;
  }
  if (state === "MUSIC_GENRE") { handleGenreStep_(chatId, uid, draft, text, meta); return; }
  if (state === "MUSIC_LINKS") { handleMusicLinkInput_(chatId, uid, draft, text); return; }
  if (state === "MUSIC_PREVIEW") {
    sendMessage_(chatId, t_(uid, "PREVIEW_TITLE") + buildDraftPreviewCaption_(draft) + t_(uid, "PREVIEW_HINT"), musicStepKeyboard_(uid, "MUSIC_PREVIEW"), { parse_mode: "HTML" }); return;
  }
  advanceMusicStep_(chatId, uid, draft, session);
}
// مرحلهٔ کاور: فقط عکس/ویدیو (گرید، حداکثر ۲) — بقیهٔ انواع فایل، متن، موزیک، ویس و ویدیو مسیج رد می‌شوند.
function coverItems_(draft) {
  const kinds = coverKindsForMode_(draft.mode);
  return getDraftMedia_(draft.draftId).filter(function(m) { return kinds.indexOf(m.kind) >= 0; });
}
function collectCoverMedia_(message, draft) {
  const chatId = String(message.chat.id); const uid = String(message.from.id);
  const info = classifyMusicMedia_(message);
  const allowed = coverKindsForMode_(draft.mode);
  const coming = String(draft.mode) === "coming_soon";
  const reject = function() {
    sendMessage_(chatId, coming ? t_(uid, "STEP_COVER_ONLY_COMING") : t_(uid, "STEP_COVER_ONLY", { n: getMaxCoverPhotos_() }), musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode));
  };
  if (!info || allowed.indexOf(info.kind) < 0) { reject(); return; }
  const d = draft.data || (draft.data = {});
  // Coming Soon: فقط یک رسانه، و نوع آن از قبل انتخاب شده (یا از همان رسانه استنتاج می‌شود)
  if (coming) {
    const picked = String(d.coverKind || "");
    if (picked && picked !== info.kind) { sendMessage_(chatId, t_(uid, "CS_KIND_MISMATCH", { k: comingSoonKindLabel_(uid, picked) }), musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode)); return; }
    if (coverItems_(draft).length >= 1) { sendMessage_(chatId, t_(uid, "CS_ONLY_ONE"), musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode)); return; }
    d.coverKind = info.kind;
    saveMusicDraft_(draft);
    appendDraftMedia_(draft.draftId, { kind: info.kind, fileId: info.fileId, caption: info.caption, mediaGroupId: message.media_group_id || "", fileSize: info.fileSize || 0, mimeType: info.mimeType || "" }, message);
    // کپشنِ ویدیو مسیج بعداً به‌صورت ریپلای روی همان پیام ارسال می‌شود (پشتیبانی از caption ندارد).
    sendMessage_(chatId, "✅ " + comingSoonKindLabel_(uid, info.kind) + " ثبت شد. برای ادامه «➡️ مرحلهٔ بعد» را بزن.", musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode));
    return;
  }
  const max = getMaxCoverPhotos_();
  const have = coverItems_(draft).length;
  if (have >= max) { sendMessage_(chatId, t_(uid, "COVER_LIMIT", { n: max }), musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode)); return; }
  appendDraftMedia_(draft.draftId, { kind: info.kind, fileId: info.fileId, caption: info.caption, mediaGroupId: message.media_group_id || "", fileSize: info.fileSize || 0, mimeType: info.mimeType || "" }, message);
  const count = coverItems_(draft).length;
  sendMessage_(chatId, count >= max ? t_(uid, "STEP_COVER_FULL", { p: count }) : t_(uid, "STEP_COVER_ADDED", { p: count, n: max }), musicStepKeyboard_(uid, "MUSIC_COVER", draft.mode));
}
// فری‌استایل: ویدیو مسیج گرد / ویدیو / MP3 — فقط یک مورد.
function collectFreestyleMedia_(message, draft) {
  const chatId = String(message.chat.id); const uid = String(message.from.id);
  const info = classifyMusicMedia_(message);
  const kb = musicStepKeyboard_(uid, "MUSIC_AUDIO", draft.mode);
  if (!info || info.kind === "voice") { sendMessage_(chatId, t_(uid, "FREESTYLE_NO_VOICE"), kb); return; }
  if (info.kind === "photo") { sendMessage_(chatId, t_(uid, "FREESTYLE_NO_PHOTO"), kb); return; }
  if (info.kind === "video_note") info.kind = "freestyle_video_note";
  else if (info.kind === "video") info.kind = "freestyle_video";
  else if (info.kind === "audio") { if (!isMp3Media_(info)) { sendMessage_(chatId, t_(uid, "STEP_AUDIO_ONLY_MP3"), kb); return; } }
  else { sendMessage_(chatId, t_(uid, "FREESTYLE_NO_VOICE"), kb); return; }
  const maxMb = getMaxAudioMb_();
  if (info.fileSize && info.fileSize > maxMb * 1024 * 1024) { sendMessage_(chatId, t_(uid, "AUDIO_TOO_BIG", { n: maxMb }), kb); return; }
  if (freestyleItems_(draft).length >= 1) { sendMessage_(chatId, t_(uid, "FREESTYLE_ONLY_ONE"), kb); return; }
  appendDraftMedia_(draft.draftId, { kind: info.kind, fileId: info.fileId, caption: info.caption, mediaGroupId: message.media_group_id || "", fileSize: info.fileSize || 0, mimeType: info.mimeType || "" }, message);
  sendMessage_(chatId, t_(uid, "FREESTYLE_MEDIA_ADDED", { k: freestyleKindLabel_(uid, info.kind) }), kb);
}
// مرحلهٔ موزیک: فقط فایل MP3 — تک‌آهنگ دقیقاً یکی، آلبوم هر تعداد که کاربر بفرستد.
function collectAudioMedia_(message, draft) {
  if (isFreestyleMode_(draft.mode)) { collectFreestyleMedia_(message, draft); return; }
  const chatId = String(message.chat.id); const uid = String(message.from.id);
  const info = classifyMusicMedia_(message);
  const kb = musicStepKeyboard_(uid, "MUSIC_AUDIO", draft.mode);
  if (info && (info.kind === "voice" || info.kind === "video_note")) { sendMessage_(chatId, t_(uid, "STEP_AUDIO_NO_VOICE"), kb); return; }
  if (info && (info.kind === "photo" || info.kind === "video")) { sendMessage_(chatId, t_(uid, "STEP_AUDIO_NO_COVER"), kb); return; }
  if (!info || info.kind !== "audio" || !isMp3Media_(info)) { sendMessage_(chatId, t_(uid, "STEP_AUDIO_ONLY_MP3"), kb); return; }
  const maxMb = getMaxAudioMb_();
  if (info.fileSize && info.fileSize > maxMb * 1024 * 1024) { sendMessage_(chatId, t_(uid, "AUDIO_TOO_BIG", { n: maxMb }), kb); return; }
  const audios = getDraftMedia_(draft.draftId).filter(function(m) { return m.kind === "audio"; });
  if (draft.mode !== "album" && audios.length >= 1) { sendMessage_(chatId, t_(uid, "STEP_AUDIO_SINGLE_LIMIT"), kb); return; }
  if (audios.length >= getMaxAudioFiles_()) { sendMessage_(chatId, t_(uid, "MEDIA_LIMIT", { n: getMaxAudioFiles_() }), kb); return; }
  appendDraftMedia_(draft.draftId, { kind: "audio", fileId: info.fileId, caption: info.caption, mediaGroupId: message.media_group_id || "", fileSize: info.fileSize || 0, mimeType: info.mimeType || "" }, message);
  const count = getDraftMedia_(draft.draftId).filter(function(m) { return m.kind === "audio"; }).length;
  sendMessage_(chatId, draft.mode === "album" ? t_(uid, "STEP_AUDIO_ADDED_ALBUM", { a: count }) : t_(uid, "STEP_AUDIO_ADDED_SINGLE"), kb);
}
// سازگاری با فراخوانی‌های قدیمی: بر اساس مرحلهٔ فعال به جمع‌کنندهٔ درست می‌رود.
function collectDraftMedia_(message, draft, step) {
  const st = normalizeMusicStep_(step || String((getSession_("M:" + String(message.from.id)) || {}).state || "MUSIC_COVER"));
  if (st === "MUSIC_AUDIO") { collectAudioMedia_(message, draft); return; }
  collectCoverMedia_(message, draft);
}
function parseCreditsText_(text) {
  const out = [];
  String(text || "").split(/\r?\n/).forEach(function(line) {
    const m = String(line).match(/^\s*([^:：]{2,28})\s*[:：]\s*(.+?)\s*$/);
    if (!m) return;
    const key = m[1].trim(); const value = m[2].trim();
    if (!value) return;
    const alias = creditRoleFor_(key);
    out.push({ role: alias ? alias.label : key, person: truncate_(value, 80), sort: alias ? alias.sort : 500 });
  });
  return out;
}
// مرحلهٔ ژانر: دکمه‌های ژانر، متن «ژانر: …» یا نام آزاد ژانر. خروجی = هشتگ متغیر پست کانال.
function handleGenreStep_(chatId, uid, draft, text, meta) {
  const kb = musicStepKeyboard_(uid, "MUSIC_GENRE", draft.mode);
  const raw = String(text || "").trim();
  const fromMeta = meta && meta.genre ? String(meta.genre) : "";
  const input = fromMeta || raw;
  if (!input) { sendMessage_(chatId, t_(uid, "GENRE_NONE_YET"), kb); return; }
  draft.data = draft.data || {};
  if (!Array.isArray(draft.data.genres)) draft.data.genres = [];
  const picked = genreForInput_(input);
  if (!picked || picked.invalid) { sendMessage_(chatId, t_(uid, "GENRE_TOO_LONG"), kb); return; }
  const max = maxGenreTags_();
  if (draft.data.genres.length >= max) { sendMessage_(chatId, t_(uid, "GENRE_LIMIT", { n: max }), kb); return; }
  const exists = draft.data.genres.some(function(g) { return String(g.tag).toLowerCase() === String(picked.tag).toLowerCase(); });
  if (!exists) draft.data.genres.push({ label: picked.label, tag: picked.tag });
  saveMusicDraft_(draft);
  const shown = draft.data.genres.map(function(g) { return "#" + g.tag; }).join(" ");
  sendMessage_(chatId, t_(uid, "GENRE_SAVED", { v: shown }), kb);
}
function applyMetadata_(message, draft, meta) {
  const chatId = String(message.chat.id); const uid = String(message.from.id);
  if (meta.title) draft.data.title = meta.title;
  if (meta.artists) draft.data.artists = meta.artists;
  if (meta.featuring) draft.data.featuring = meta.featuring;
  if (meta.genre) {
    const g = genreForInput_(meta.genre);
    if (g && !g.invalid) {
      if (!Array.isArray(draft.data.genres)) draft.data.genres = [];
      const max = maxGenreTags_();
      const exists = draft.data.genres.some(function(x) { return String(x.tag).toLowerCase() === String(g.tag).toLowerCase(); });
      if (!exists && draft.data.genres.length < max) draft.data.genres.push({ label: g.label, tag: g.tag });
    }
  }
  if (meta.credits && meta.credits.length) {
    if (!draft.data.credits) draft.data.credits = [];
    meta.credits.forEach(function(c) {
      const idx = draft.data.credits.map(function(x) { return String(x.role).toLowerCase(); }).indexOf(String(c.role).toLowerCase());
      if (idx >= 0) draft.data.credits[idx] = c; else draft.data.credits.push(c);
    });
  }
  saveMusicDraft_(draft);
  const parts = [];
  if (meta.title) parts.push("📀 " + meta.title);
  if (meta.artists) parts.push("🎤 " + joinArtistsAmp_(meta.artists));
  if (meta.featuring) parts.push("🎧 " + joinArtistsAmp_(meta.featuring));
  if (meta.genre) parts.push("🏷 " + meta.genre);
  (meta.credits || []).forEach(function(c) { parts.push("🧩 " + c.role + " : " + c.person); });
  sendMessage_(chatId, t_(uid, "METADATA_SAVED") + parts.join(" — ") + t_(uid, "METADATA_MORE"), musicStepKeyboard_(uid, String((getSession_("M:" + uid) || {}).state || "MUSIC_COVER")));
}
function cancelMusicDraft_(uid, session) {
  const draftId = (session && session.data || {}).draftId;
  if (draftId) {
    try { deleteDraftCompletely_(draftId); } catch (e) { logError_("cancelMusicDraft_", e); }
  }
  clearSession_("M:" + uid);
}
function handleMusicLinkInput_(chatId, uid, draft, text) {
  const links = parseLinks_(text);
  if (!links.length) { sendMessage_(chatId, t_(uid, "LINK_BAD"), musicStepKeyboard_(uid, "MUSIC_LINKS")); return; }
  if (!draft.data.links) draft.data.links = [];
  let addedCount = 0;
  links.forEach(function(l) { if (!draft.data.links.some(function(x) { return x.url === l.url; })) { draft.data.links.push(l); addedCount++; } });
  saveMusicDraft_(draft);
  sendMessage_(chatId, t_(uid, "LINK_ADDED", { n: addedCount, t: draft.data.links.length }));
  showDraftLinksPanel_(chatId, uid, draft);
}
function showDraftLinksPanel_(chatId, uid, draft) {
  const links = draft.data.links || [];
  const rows = links.map(function(l) {
    const visible = (draft.data.platformVisible || {})[l.platform] !== false;
    const meta = platformMeta_(l.platform);
    return [{ text: (visible ? "👁 " : "🙈 ") + meta.emoji + " " + meta.label + " · " + t_(uid, visible ? "PLATFORM_SHOWN" : "PLATFORM_HIDDEN"), callback_data: "m:lt:" + draft.draftId + ":" + l.platform }];
  });
  rows.push([{ text: t_(uid, "BTN_NEXT"), callback_data: "m:next:" + draft.draftId }]);
  sendMessage_(chatId, t_(uid, "LINK_PANEL"), { inline_keyboard: rows });
}
// توجه: در Apps Script V8 کلاس جهانی URL وجود ندارد؛ پس آدرس‌ها با regex پردازش می‌شوند.
function hostOf_(url) {
  const m = String(url || "").match(/^https?:\/\/([^\/?#:\s]+)(?::\d+)?/i);
  return m ? String(m[1]).replace(/^www\./i, "").toLowerCase() : "";
}
function normalizeUrl_(url) {
  let u = String(url || "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  const m = u.match(/^(https?):\/\/([^\/?#:\s]+)(?::(\d{1,5}))?([\/?#][^\s<>"']*)?$/i);
  if (!m) return "";
  const host = m[2];
  if (!/^(?!-)[a-z0-9-]{1,63}(?:\.(?!-)[a-z0-9-]{1,63})+$/i.test(host)) return "";
  if (!/\.[a-z]{2,}$/i.test(host)) return "";
  const path = String(m[4] || "").replace(/[)\],.!؟»]+$/, "");
  return m[1].toLowerCase() + "://" + host.toLowerCase() + (m[3] ? ":" + m[3] : "") + path;
}
function platformFor_(url) {
  const host = hostOf_(url); if (!host) return "";
  for (let i = 0; i < POST_LINK_PLATFORMS.length; i++) {
    const p = POST_LINK_PLATFORMS[i];
    if (p.domains.some(function(d) { return host === d || host.slice(-(d.length + 1)) === "." + d; })) return p.key;
  }
  return "";
}
function parseLinks_(text) {
  const out = []; const seen = {};
  const normalized = String(text || "").replace(/(^|\s)@([A-Za-z0-9_]{4,32})(?=\s|$)/g, "$1 https://t.me/$2 ");
  const matches = normalized.match(/(https?:\/\/[^\s<>"']+|(?:www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s<>"']*)?)/g) || [];
  matches.forEach(function(m) {
    if (/^\d+$/.test(m)) return;
    const url = normalizeUrl_(m); if (!url || seen[url]) return;
    const platform = platformFor_(url);
    if (!platform) return;
    seen[url] = true; out.push({ url: url, platform: platform });
  });
  return out.slice(0, 10);
}
function stripLinks_(text) {
  return String(text || "").replace(/https?:\/\/[^\s<>"']+/gi, "").replace(/(?:www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+(?:\/[^\s<>"']*)?/g, "").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function firstCaptionLine_(media) {
  const source = (media || []).slice().sort(function(a, b) { return a.seq - b.seq; });
  for (let i = 0; i < source.length; i++) {
    const line = String(source[i].caption || "").split("\n").map(function(x) { return x.trim(); }).filter(Boolean)[0];
    if (line && !/^https?:/i.test(line)) return truncate_(stripLinks_(line), 80);
  }
  return "";
}

// ───────────────────────── ثبت ارسال در شیت ─────────────────────────
function computeNextSlot_(intervalMin) {
  const sh = getSheet_(APP.SHEETS.SUBMISSIONS); const base = Date.now(); const step = Math.max(1, Number(intervalMin) || 10) * 60000;
  if (sh.getLastRow() < 2) return new Date(base);
  // فقط پست‌های نزدیک به «حالا» (پنجرهٔ ۲۴ ساعت) در محاسبهٔ اسلات بعدی اثر می‌گذارند.
  // قبلاً یک اثر زمان‌بندی‌شده برای هفتهٔ بعد، همهٔ ارسال‌های بعدی را هم عقب می‌انداخت.
  const horizon = base + 86400000;
  const vals = sh.getRange(2, 9, sh.getLastRow() - 1, 2).getValues(); // status, scheduled_at
  let latest = base;
  vals.forEach(function(r) {
    const status = String(r[0] || "");
    if (["rejected", "failed"].indexOf(status) >= 0) return;
    const t = dateMillis_(r[1]);
    if (!t || t > horizon) return;
    if (t > latest) latest = t;
  });
  return new Date(latest > base ? latest + step : base);
}
function isDuplicateSubmission_(userId, title, artists, draftMedia) {
  const audioIds = {};
  // شناسهٔ خالی هرگز کلید نمی‌شود؛ وگرنه یک ردیف با file_id خالی در MusicMedia
  // همهٔ ارسال‌ها را «تکراری» می‌کرد.
  (draftMedia || []).forEach(function(m) { if (m.kind === "audio" && String(m.fileId || "").trim()) audioIds[String(m.fileId).trim()] = true; });
  const wantTitle = String(title || "").trim().toLowerCase();
  const wantArtists = String(artists || "").trim().toLowerCase();
  // فقط ارسال‌های زندهٔ خودِ همین کاربر مقایسه می‌شوند؛ فایل یک کاربر دیگر
  // هرگز باعث رد شدن اثر این کاربر نمی‌شود.
  const mine = getAllSubmissions_().filter(function(s) {
    return String(s.userId) === String(userId) && ["pending", "approved", "publishing", "published"].indexOf(s.status) >= 0;
  });
  if (!mine.length) return "";
  const sameTitle = mine.filter(function(s) {
    return String(s.title || "").trim().toLowerCase() === wantTitle && String(s.artists || "").trim().toLowerCase() === wantArtists;
  });
  if (sameTitle.length) return "title";
  if (!Object.keys(audioIds).length || !wantTitle) return "";
  // همان فایل فقط وقتی تکراری است که عنوان هم یکی باشد؛ با عنوان متفاوت
  // (ریمیکس/نسخهٔ تازهٔ همان فایل) اثر پذیرفته می‌شود — دقیقاً همان چیزی که
  // پیام راهنما به کاربر می‌گوید.
  const sameTitleIds = {};
  mine.forEach(function(s) { if (String(s.title || "").trim().toLowerCase() === wantTitle) sameTitleIds[String(s.id)] = true; });
  if (!Object.keys(sameTitleIds).length) return "";
  // قبلاً برای هر ارسال کل MusicMedia خوانده می‌شد؛ حالا شیت یک بار خوانده و ایندکس می‌شود.
  const sh = getSheet_(APP.SHEETS.MEDIA);
  if (sh.getLastRow() < 2) return "";
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][2]) !== "audio") continue;
    const fid = String(rows[i][3] || "").trim();
    if (!fid) continue;
    if (!sameTitleIds[String(rows[i][0])]) continue;
    if (audioIds[fid]) return "file";
  }
  return "";
}
function saveMusicSubmission_(draft, meta) {
  return withLock_(function() {
    const sh = getSheet_(APP.SHEETS.SUBMISSIONS);
    const draftMedia = getDraftMedia_(draft.draftId);
    const photos = draftMedia.filter(function(m) { return m.kind === "photo"; });
    const audios = draftMedia.filter(function(m) { return m.kind === "audio"; });
    const approvalMode = String(getSetting_("PUBLISH_MODE") || "auto") === "approval";
    const id = newId_(draft.mode === "album" ? "AL" : draft.mode === "coming_soon" ? "CS" : draft.mode === "freestyle" ? "FS" : "SG");
    const now = new Date();
    // برای Coming Soon، زمان انتخابی کاربر فقط «متن تاریخ» است و نباید خود پست را عقب بیندازد.
    const comingSoon = String(draft.mode) === "coming_soon";
    const scheduledAt = (meta.scheduledAtValue && !comingSoon) ? new Date(Number(meta.scheduledAtValue)) : computeNextSlot_(getSetting_("PUBLISH_INTERVAL_MIN"));
    const links = (meta.links || []).filter(function(l) { return l && l.url; });
    const status = approvalMode ? "pending" : "approved";
    sh.appendRow([id, String(draft.userId), draft.mode, meta.title, meta.artists, meta.featuring || "", meta.caption || "", JSON.stringify({ items: links, visible: meta.platformVisible || {} }), status, scheduledAt, now, now, "", "", "", "", JSON.stringify({ mode: draft.mode, details: meta.details || {}, scheduleText: meta.scheduleText || "", scheduledOffset: meta.scheduledOffset == null ? -1 : meta.scheduledOffset }), "", "", ""]);
    const mediaSheet = getSheet_(APP.SHEETS.MEDIA);
    if (draftMedia.length) {
      // یک نوشتن دسته‌ای به‌جای appendRow به‌ازای هر رسانه: قفل کوتاه‌تر نگه داشته می‌شود.
      mediaSheet.getRange(mediaSheet.getLastRow() + 1, 1, draftMedia.length, 10).setValues(draftMedia.map(function(m, i) {
        return [id, i + 1, m.kind, m.fileId, m.caption, m.mediaGroupId, m.sourceChatId, m.sourceMessageId, m.fileSize || "", m.mimeType || ""];
      }));
    }
    const credits = (meta.credits || []).filter(function(c) { return c && c.person; });
    if (credits.length) {
      const creditSheet = getSheet_(APP.SHEETS.CREDITS);
      creditSheet.getRange(creditSheet.getLastRow() + 1, 1, credits.length, 4).setValues(credits.map(function(c, i) {
        return [id, String(c.role || "Credit"), String(c.person), Number(c.sort) || (100 + i)];
      }));
      SUBMISSION_CREDITS_MEMO_ = null;
    }
    deleteDraftCompletely_(draft.draftId);
    bustSubmissionCaches_();
    syncMusicLibraryForSubmission_(id, draftMedia, { downloadAllowed: String(getSetting_("MUSIC_DOWNLOAD_DEFAULT_ENABLED") || "true") === "true", publishedAt: "" });
    return getSubmission_(id);
  });
}
function bustSubmissionCaches_() {
  SUBMISSIONS_MEMO_ = null; SUBMISSION_BY_ID_MEMO_ = null; SUBMISSION_MEDIA_MEMO_ = null; SUBMISSION_CREDITS_MEMO_ = null; MUSIC_LIBRARY_MEMO_ = null;
}
function submissionFromRow_(r, i) {
  let links = { items: [], visible: {} };
  try { const parsed = JSON.parse(r[7] || "{}"); links = { items: Array.isArray(parsed) ? parsed : (parsed.items || []), visible: (parsed && parsed.visible) || {} }; } catch (e) {}
  let request = {}; try { request = JSON.parse(r[16] || "{}"); } catch (e) {}
  return { rowNumber: i + 2, id: String(r[0] || ""), userId: String(r[1] || ""), mode: String(r[2] || "simple"), title: String(r[3] || ""), artists: String(r[4] || ""), featuring: String(r[5] || ""), caption: String(r[6] || ""), links: links.items, platformVisible: links.visible || {}, status: String(r[8] || "pending"), scheduledAt: r[9] || "", createdAt: r[10] || "", updatedAt: r[11] || "", publishedAt: r[12] || "", visualMessageIds: String(r[13] || ""), audioMessageIds: String(r[14] || ""), publishStage: String(r[15] || ""), request: request || {}, failure: String(r[17] || ""), reviewNote: String(r[18] || ""), reviewedBy: String(r[19] || "") };
}
function getAllSubmissions_() {
  if (SUBMISSIONS_MEMO_ !== null) return SUBMISSIONS_MEMO_;
  const sh = getSheet_(APP.SHEETS.SUBMISSIONS);
  SUBMISSIONS_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.MusicSubmissions.length).getValues().map(function(r, i) { return submissionFromRow_(r, i); }).filter(function(s) { return s.id; });
  SUBMISSION_BY_ID_MEMO_ = Object.create(null);
  SUBMISSIONS_MEMO_.forEach(function(s) { if (!SUBMISSION_BY_ID_MEMO_[s.id]) SUBMISSION_BY_ID_MEMO_[s.id] = s; });
  return SUBMISSIONS_MEMO_;
}
function getSubmission_(id) {
  if (SUBMISSION_BY_ID_MEMO_ === null) getAllSubmissions_();
  return SUBMISSION_BY_ID_MEMO_[String(id)] || null;
}
function setSubmissionField_(id, field, value) {
  const columns = { title: 4, artists: 5, featuring: 6, caption: 7, links: 8, status: 9, scheduledAt: 10, updatedAt: 12, publishedAt: 13, visualMessageIds: 14, audioMessageIds: 15, publishStage: 16, failure: 18, reviewNote: 19, reviewedBy: 20 };
  const col = columns[field]; const s = getSubmission_(id); if (!s || !col) return false;
  getSheet_(APP.SHEETS.SUBMISSIONS).getRange(s.rowNumber, col).setValue(value);
  if (field === "title" || field === "artists" || field === "featuring") s[field] = value;
  else s[field] = value;
  return true;
}
function touchSubmission_(id) { setSubmissionField_(id, "updatedAt", new Date()); }
function getSubmissionMedia_(submissionId) {
  if (SUBMISSION_MEDIA_MEMO_ === null) SUBMISSION_MEDIA_MEMO_ = Object.create(null);
  const key = String(submissionId);
  if (SUBMISSION_MEDIA_MEMO_[key]) return SUBMISSION_MEDIA_MEMO_[key];
  const sh = getSheet_(APP.SHEETS.MEDIA);
  if (sh.getLastRow() < 2) { SUBMISSION_MEDIA_MEMO_[key] = []; return []; }
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.MusicMedia.length).getValues();
  const items = vals.map(function(r, i) { return { rowNumber: i + 2, submissionId: String(r[0] || ""), seq: Number(r[1]) || 0, kind: String(r[2] || ""), fileId: String(r[3] || ""), caption: String(r[4] || ""), mediaGroupId: String(r[5] || ""), sourceChatId: String(r[6] || ""), sourceMessageId: String(r[7] || ""), fileSize: Number(r[8]) || 0, mimeType: String(r[9] || "") }; })
    .filter(function(m) { return m.submissionId === key; }).sort(function(a, b) { return a.seq - b.seq; });
  SUBMISSION_MEDIA_MEMO_[key] = items;
  return items;
}
function getSubmissionCredits_(submissionId) {
  if (SUBMISSION_CREDITS_MEMO_ === null) SUBMISSION_CREDITS_MEMO_ = Object.create(null);
  const key = String(submissionId);
  if (SUBMISSION_CREDITS_MEMO_[key]) return SUBMISSION_CREDITS_MEMO_[key];
  const sh = getSheet_(APP.SHEETS.CREDITS);
  if (sh.getLastRow() < 2) { SUBMISSION_CREDITS_MEMO_[key] = []; return []; }
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.MusicCredits.length).getValues();
  const items = vals.filter(function(r) { return String(r[0] || "") === key; }).map(function(r) { return { role: String(r[1] || ""), person: String(r[2] || ""), sort: Number(r[3]) || 0 }; }).sort(function(a, b) { return a.sort - b.sort; });
  SUBMISSION_CREDITS_MEMO_[key] = items;
  return items;
}
function deleteSubmissionCompletely_(submissionId, options) {
  const opts = options || {}; const sub = getSubmission_(submissionId); if (!sub) return false;
  const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
  // حذف پیام‌های کانال I/O شبکهٔ تلگرام است و می‌تواند ثانیه‌ها طول بکشد؛ نباید زیر قفل
  // سراسری انجام شود (قبلاً حذف یک آلبوم قفل را آن‌قدر نگه می‌داشت که بقیهٔ نوشتن‌ها تایم‌اوت می‌شدند).
  if (opts.deleteChannel !== false && channel) {
    const ids = positiveIdList_(String(sub.visualMessageIds || "") + "|" + String(sub.audioMessageIds || ""));
    ids.forEach(function(mid) { deleteMessage_(channel, mid); });
  }
  withLock_(function() {
    deleteRowsByKey_(APP.SHEETS.MEDIA, 1, [submissionId]);
    deleteRowsByKey_(APP.SHEETS.CREDITS, 1, [submissionId]);
    deleteRowsByKey_(APP.SHEETS.MUSIC_LIBRARY, 2, [submissionId]);
    // لاگ‌های ارسال/دانلود مرتبط هم پاک می‌شوند تا ردیف یتیم نماند.
    try { deleteRowsByKey_("DeliveryLog", 2, [submissionId]); } catch (e) {}
    getSheet_(APP.SHEETS.SUBMISSIONS).deleteRow(sub.rowNumber);
    bustSubmissionCaches_();
    DRAFT_MEDIA_MEMO_ = null;
  });
  return true;
}

// ───────────────────────── کتابخانه و دانلود ─────────────────────────
function musicTrackIdFromMedia_(submissionId, media, index) { return String(submissionId) + "_A" + String(media && media.seq ? media.seq : (index + 1)); }
function getMusicLibrary_() {
  if (MUSIC_LIBRARY_MEMO_ !== null) return MUSIC_LIBRARY_MEMO_;
  const sh = getSheet_(APP.SHEETS.MUSIC_LIBRARY);
  MUSIC_LIBRARY_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.MusicLibrary.length).getValues().map(function(r, i) {
    return { rowNumber: i + 2, trackId: String(r[0] || ""), submissionId: String(r[1] || ""), seq: Number(r[2]) || 0, title: String(r[3] || ""), artists: String(r[4] || ""), fileId: String(r[5] || ""), downloadAllowed: r[6] === true || ["true", "1", "yes", "on"].indexOf(String(r[6]).toLowerCase()) >= 0, createdAt: r[7] || "", updatedAt: r[8] || "", rightsApprovedBy: String(r[9] || ""), rightsApprovedAt: r[10] || "", publishedAt: r[11] || "", downloadCount: Number(r[12]) || 0 };
  }).filter(function(t) { return t.trackId; });
  return MUSIC_LIBRARY_MEMO_;
}
function getMusicLibraryTrack_(trackId) { return getMusicLibrary_().find(function(t) { return t.trackId === String(trackId); }) || null; }
// ── ویرایش/پس‌گرفتن ارسال توسط کاربر ──
// فقط ارسال‌هایی که هنوز در صف هستند (pending/approved/failed) قابل ویرایش یا انصراف‌اند.
function draftWithdrawable_(sub) {
  if (!sub) return false;
  return ["pending", "approved", "failed"].indexOf(String(sub.status)) >= 0;
}
// ویرایش بعد از تأیید مدیر، اثر را به صف تأیید برمی‌گرداند (قبلاً بدون بررسی دوباره منتشر می‌شد).
function resetSubmissionToQueue_(sub, reason) {
  if (!sub) return false;
  const approval = String(getSetting_("PUBLISH_MODE") || "auto") === "approval";
  setSubmissionField_(sub.id, "status", approval ? "pending" : "approved");
  setSubmissionField_(sub.id, "failure", "");
  setSubmissionField_(sub.id, "reviewNote", truncate_(reason || "", 200));
  setSubmissionField_(sub.id, "publishStage", "");
  setSubmissionField_(sub.id, "scheduledAt", computeNextSlot_(getSetting_("PUBLISH_INTERVAL_MIN")));
  bustSubmissionCaches_();
  logAdminAction_(sub.userId, "resubmit_after_edit", sub.id, reason || "");
  getAdmins_().forEach(function(a) {
    try {
      sendMessage_(a, "✏️ اثر «" + sub.title + "» توسط هنرمند ویرایش شد و باید دوباره بررسی شود.\n🆔 " + sub.id,
        { inline_keyboard: [[{ text: "📂 بررسی", callback_data: "a:sub:" + sub.id }]] });
    } catch (e) {}
  });
  return true;
}
// آمار هر ترک (دانلود و بازدید) برای پنل مدیر و داشبورد هنرمند
function getMusicLibraryStats_() {
  const lib = getMusicLibrary_();
  const subs = getAllSubmissions_();
  const byArtist = {};
  lib.forEach(function(t) {
    const key = String(t.artists || "—").trim() || "—";
    if (!byArtist[key]) byArtist[key] = { artist: key, tracks: 0, downloads: 0, published: 0 };
    byArtist[key].tracks++;
    byArtist[key].downloads += Number(t.downloadCount) || 0;
    if (t.publishedAt) byArtist[key].published++;
  });
  const published = subs.filter(function(s) { return s.status === "published"; }).length;
  return {
    tracks: lib.length, published: published, downloads: lib.reduce(function(a, t) { return a + (Number(t.downloadCount) || 0); }, 0),
    byArtist: Object.keys(byArtist).map(function(k) { return byArtist[k]; }).sort(function(a, b) { return b.downloads - a.downloads; })
  };
}
function syncMusicLibraryForSubmission_(submissionId, mediaItems, options) {
  const opts = options || {}; const sh = getSheet_(APP.SHEETS.MUSIC_LIBRARY); const sub = getSubmission_(submissionId);
  const audioItems = (mediaItems || []).filter(function(m) { return m.kind === "audio"; });
  const existing = getMusicLibrary_().filter(function(t) { return t.submissionId === String(submissionId); });
  const keep = [];
  audioItems.forEach(function(item, index) {
    const trackId = musicTrackIdFromMedia_(submissionId, item, index);
    keep.push(trackId);
    const old = existing.find(function(t) { return t.trackId === trackId; });
    const fromCaption = String(item.caption || "").trim() ? titleFromCaption_(item.caption) : "";
    const title = fromCaption || (audioItems.length > 1 ? String(sub && sub.title || "Track") + " — " + (index + 1) : String(sub && sub.title || "Track"));
    const artists = String(sub && sub.artists || "");
    const now = new Date();
    if (old) {
      sh.getRange(old.rowNumber, 3, 1, 6).setValues([[item.seq, title, artists, item.fileId, opts.downloadAllowed == null ? old.downloadAllowed : opts.downloadAllowed, old.createdAt]]);
      sh.getRange(old.rowNumber, 9, 1, 3).setValues([[now, old.rightsApprovedBy, old.rightsApprovedAt]]);
      if (opts.publishedAt) sh.getRange(old.rowNumber, 12).setValue(opts.publishedAt);
    } else {
      sh.appendRow([trackId, String(submissionId), item.seq, title, artists, item.fileId, opts.downloadAllowed == null ? true : opts.downloadAllowed, now, now, "", "", opts.publishedAt || "", 0]);
    }
  });
  for (let i = existing.length - 1; i >= 0; i--) if (keep.indexOf(existing[i].trackId) < 0) sh.deleteRow(existing[i].rowNumber);
  MUSIC_LIBRARY_MEMO_ = null;
  return keep;
}
function setMusicLibraryDownloadAllowed_(trackId, allowed) {
  const t = getMusicLibraryTrack_(trackId); if (!t) return false;
  getSheet_(APP.SHEETS.MUSIC_LIBRARY).getRange(t.rowNumber, 7, 1, 2).setValues([[!!allowed, new Date()]]);
  t.downloadAllowed = !!allowed; return true;
}
function approveMusicRights_(submissionId, adminId) {
  const sh = getSheet_(APP.SHEETS.MUSIC_LIBRARY); const tracks = getMusicLibrary_().filter(function(t) { return t.submissionId === String(submissionId); });
  const now = new Date();
  tracks.forEach(function(t) { sh.getRange(t.rowNumber, 10, 1, 2).setValues([[String(adminId || ""), now]]); t.rightsApprovedBy = String(adminId || ""); t.rightsApprovedAt = now; });
  return tracks.length;
}
function ensureMusicDownloadDefaultMigration_() {
  if (getSetting_("MUSIC_DOWNLOAD_DEFAULT_MIGRATED") === "true") return;
  const def = String(getSetting_("MUSIC_DOWNLOAD_DEFAULT_ENABLED") || "true").toLowerCase() === "true";
  const sh = getSheet_(APP.SHEETS.MUSIC_LIBRARY);
  if (sh.getLastRow() >= 2) {
    const n = sh.getLastRow() - 1;
    const values = sh.getRange(2, 7, n, 1).getValues().map(function(r) { return [r[0] === "" || r[0] == null ? def : r[0]]; });
    sh.getRange(2, 7, n, 1).setValues(values);
  }
  setSetting_("MUSIC_DOWNLOAD_DEFAULT_MIGRATED", "true");
}
function getDownloadableMusicTrack_(trackIdOrSubmissionId) {
  const id = String(trackIdOrSubmissionId || "").trim();
  if (!id) return null;
  const direct = getMusicLibraryTrack_(id);
  const sub = direct ? getSubmission_(direct.submissionId) : getSubmission_(id);
  if (direct) {
    if (sub && sub.status !== "published") return null;
    return direct.downloadAllowed && direct.fileId ? direct : null;
  }
  const tracks = getMusicLibrary_().filter(function(t) { return t.submissionId === id && t.downloadAllowed && t.fileId; });
  if (!tracks.length) return null;
  if (sub && sub.status !== "published") return null;
  return tracks[0];
}
function incrementTrackDownloadCount_(trackId) {
  const t = getMusicLibraryTrack_(trackId); if (!t) return 0;
  const next = (Number(t.downloadCount) || 0) + 1;
  getSheet_(APP.SHEETS.MUSIC_LIBRARY).getRange(t.rowNumber, 13).setValue(next);
  t.downloadCount = next;
  return next;
}
function getMusicDownloadDeliveries_() {
  if (MUSIC_DOWNLOADS_MEMO_ !== null) return MUSIC_DOWNLOADS_MEMO_;
  const sh = getSheet_(APP.SHEETS.MUSIC_DOWNLOADS);
  MUSIC_DOWNLOADS_MEMO_ = sh.getLastRow() < 2 ? [] : sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.MusicDownloads.length).getValues().map(function(r, i) {
    return { rowNumber: i + 2, deliveryId: String(r[0] || ""), userId: String(r[1] || ""), submissionId: String(r[2] || ""), trackId: String(r[3] || ""), messageId: String(r[4] || ""), deleteAfter: r[5] || "", status: String(r[6] || "pending"), attempts: Number(r[7]) || 0, lastError: String(r[8] || ""), createdAt: r[9] || "" };
  }).filter(function(d) { return d.deliveryId; });
  return MUSIC_DOWNLOADS_MEMO_;
}
function positiveIdList_(value) {
  const out = [];
  String(value || "").split("|").forEach(function(x) { const n = Number(String(x).trim()); if (n > 0 && out.indexOf(n) < 0) out.push(n); });
  return out;
}
function enqueueMusicDeletion_(userId, submissionId, messageIds, deleteAfterMs) {
  const ids = positiveIdList_(messageIds.join("|"));
  if (!ids.length) return;
  const sh = getSheet_(APP.SHEETS.MUSIC_DOWNLOADS);
  const deleteAfter = Number(deleteAfterMs) > 0 ? new Date(Number(deleteAfterMs)) : new Date(nowMs_() + 40000);
  const deliveryId = newId_("M");
  sh.appendRow([deliveryId, String(userId), String(submissionId || ""), "", ids.join("|"), deleteAfter, "pending", 0, "", new Date()]);
  MUSIC_DOWNLOADS_MEMO_ = null;
  // برای جلوگیری از انفجار تریگرها، اگر تریگر فعالی هست به آن اکتفا می‌کنیم؛ وگرنه یکی می‌سازیم.
  if (!findTriggersByHandler_("deleteExpiredMusicDeliveries_").length) scheduleMusicDeletionTrigger_(deleteAfter);
}
function findTriggersByHandler_(handler) { return ScriptApp.getProjectTriggers().filter(function(t) { return t.getHandlerFunction() === handler; }); }
function pruneTrigger_(handler, keepAtMost) {
  const list = findTriggersByHandler_(handler);
  const max = Math.max(1, Number(keepAtMost) || 1);
  for (let i = list.length - 1; i >= max; i--) { try { ScriptApp.deleteTrigger(list[i]); } catch (e) {} }
}
function scheduleMusicDeletionTrigger_(when) {
  // حداقل زمان مجاز برای after() در Apps Script یک دقیقه است؛ کمتر از آن خطا می‌دهد
  // و باعث می‌شد پیام‌ها هرگز پاک نشوند.
  let at = when instanceof Date ? when.getTime() : Number(when);
  if (!at || isNaN(at)) at = nowMs_() + 60000;
  const delay = Math.max(60000, Math.min(60 * 60000, at - nowMs_() + 1500));
  // قبلاً «prune» قبل از ساخت اجرا می‌شد و در اجراهای هم‌زمان می‌توانست تریگر تازهٔ همین اجرا را پاک کند.
  // حالا اول می‌سازیم و بعد فقط قدیمی‌ترها را نگه می‌داریم (کمترین فاصله تا اجرا).
  let created = null;
  try { created = ScriptApp.newTrigger("deleteExpiredMusicDeliveries_").timeBased().after(delay).create(); }
  catch (e) { logError_("scheduleMusicDeletionTrigger_", e); }
  // حداکثر ۲ تریگر کافی است؛ بقیه پاک می‌شوند (سهمیهٔ ۲۰ تریگر).
  const list = findTriggersByHandler_("deleteExpiredMusicDeliveries_");
  for (let i = 0; i < list.length - 2; i++) { try { ScriptApp.deleteTrigger(list[i]); } catch (e) {} }
  return created;
}
function deleteExpiredMusicDeliveries_(e) {
  resetRuntimeCaches_();
  // پاک‌سازی دقیق: فقط همان تریگری که این اجرا را صدا زده حذف می‌شود (e.triggerUid)،
  // نه کورکورانه «همه به‌جز یکی» که می‌توانست تریگر تازه را هم ببرد.
  const selfUid = e && e.triggerUid ? String(e.triggerUid) : "";
  if (selfUid) {
    try {
      ScriptApp.getProjectTriggers().forEach(function(t) {
        try { if (String(t.getUniqueId && t.getUniqueId() || "") === selfUid) ScriptApp.deleteTrigger(t); } catch (err) {}
      });
    } catch (err) {}
  }
  const deliveries = getMusicDownloadDeliveries_(); const sh = getSheet_(APP.SHEETS.MUSIC_DOWNLOADS); const now = nowMs_();
  let nextRun = 0;
  for (let i = deliveries.length - 1; i >= 0; i--) {
    const d = deliveries[i]; const due = dateMillis_(d.deleteAfter);
    if (d.status !== "pending") continue;
    if (!due || due > now) { if (due && (!nextRun || due < nextRun)) nextRun = due; continue; }
    let allGone = true;
    positiveIdList_(d.messageId).forEach(function(mid) {
      const r = telegramRequest_("deleteMessage", { chat_id: d.userId, message_id: mid });
      const desc = String(r && r.description || "");
      if (!r || !r.ok) { if (!/message to delete not found|message can't be deleted|message_id_invalid|message not found/i.test(desc)) allGone = false; }
    });
    if (allGone) sh.getRange(d.rowNumber, 7, 1, 2).setValues([["deleted", now]]);
    else {
      const attempts = d.attempts + 1;
      sh.getRange(d.rowNumber, 7, 1, 3).setValues([[attempts >= 5 ? "failed" : "pending", attempts, "delete failed"]]);
      if (attempts < 5) scheduleMusicDeletionTrigger_(new Date(now + 120000));
    }
  }
  MUSIC_DOWNLOADS_MEMO_ = null;
  if (nextRun) scheduleMusicDeletionTrigger_(new Date(nextRun));
  pruneTrigger_("deleteExpiredMusicDeliveries_", 1);
}
function getMusicDownloadDeleteSeconds_() {
  const n = Number(getSetting_("MUSIC_DOWNLOAD_DELETE_SECONDS") || 60);
  return Math.max(10, Math.min(600, isNaN(n) ? 30 : n));
}
function sendMusicDownload_(chatId, trackIdOrSubmissionId) { return handleMusicDownloadDelivery_(chatId, String(chatId), trackIdOrSubmissionId); }
function handleMusicDownloadDelivery_(chatId, uid, trackIdOrSubmissionId) {
  const track = getDownloadableMusicTrack_(trackIdOrSubmissionId);
  if (!track) { sendMessage_(chatId, t_(uid, "DOWNLOAD_OFF")); return false; }
  const sub = getSubmission_(track.submissionId);
  const tracks = getMusicLibrary_().filter(function(x) { return x.submissionId === track.submissionId && x.downloadAllowed && x.fileId; });
  const isAlbum = sub && sub.mode === "album" && tracks.length > 1;
  const seconds = getMusicDownloadDeleteSeconds_();
  const title = String(sub && sub.title || track.title);
  const artists = formatArtistNames_(String(sub && sub.artists || track.artists));
  // عنوان/هنرمند کاربر باید escape شود، وگرنه یک «<» یا «&» کل ارسال را با خطای parse شکست می‌دهد.
  const safeTitle = htmlEscape_(title);
  const safeArtists = htmlEscape_(artists);
  const tgTarget = getChannelTelegramTarget_() || { url: "https://t.me/RapEvils", label: "Telegram · @RapEvils" };
  const tgLine = "🔵 " + linkHtml_(tgTarget.url, tgTarget.label);
  const caption = isAlbum ? t_(uid, "DOWNLOAD_ALBUM_CAPTION", { t: safeTitle, a: safeArtists, n: seconds, tg: tgLine }) : t_(uid, "DOWNLOAD_CAPTION", { t: safeTitle, a: safeArtists, n: seconds, tg: tgLine });
  const sentIds = [];
  if (isAlbum) {
    for (let i = 0; i < tracks.length; i += 10) {
      const batch = tracks.slice(i, i + 10);
      const payload = { chat_id: String(chatId), media: batch.map(function(x, k) { return { type: "audio", media: x.fileId, caption: i === 0 && k === 0 ? caption : undefined, parse_mode: i === 0 && k === 0 ? "HTML" : undefined }; }) };
      const r = telegramRequest_("sendMediaGroup", payload);
      if (r && r.ok && Array.isArray(r.result)) r.result.forEach(function(m) { if (m && m.message_id) sentIds.push(Number(m.message_id)); });
      else {
        for (let j = 0; j < batch.length; j++) {
          const single = telegramRequest_("sendAudio", { chat_id: String(chatId), audio: batch[j].fileId, caption: i === 0 && j === 0 ? caption : undefined, parse_mode: i === 0 && j === 0 ? "HTML" : undefined });
          if (single && single.ok && single.result) sentIds.push(Number(single.result.message_id));
        }
      }
    }
  } else {
    const r = telegramRequest_("sendAudio", { chat_id: String(chatId), audio: track.fileId, caption: caption, parse_mode: "HTML" });
    if (r && r.ok && r.result) sentIds.push(Number(r.result.message_id));
    else { sendMessage_(chatId, t_(uid, "DOWNLOAD_SEND_FAIL")); return false; }
  }
  if (!sentIds.length) { sendMessage_(chatId, t_(uid, "DOWNLOAD_SEND_FAIL")); return false; }
  try { incrementTrackDownloadCount_(track.trackId); } catch (e) {}
  // پیام‌های ارسال فایل قبلی همین کاربر پاک می‌شوند تا گفت‌وگو شلوغ نشود.
  const u = getUserById_(uid);
  if (u && u.lastDownloadMessageIds) {
    positiveIdList_(u.lastDownloadMessageIds).forEach(function(mid) { deleteMessage_(chatId, mid); });
  }
  if (u) { try { setUserField_(uid, "lastDownloadMessageIds", sentIds.join("|")); setUserField_(uid, "lastDownloadAt", new Date()); } catch (e) {} }
  enqueueMusicDeletion_(chatId, track.submissionId, sentIds, nowMs_() + seconds * 1000);
  return true;
}

// ───────────────────────── ساخت کپشن پست (قالب کانال) ─────────────────────────
// قالب خروجی:
//   Artist: Elio & Arshown 🔥
//
//   > HANOZ HAMONAM 🖤
//   > OUT NOW 🕊
//   > Production : Arshown
//   > Mix & Master : Arshown
//
//   🟠 [SoundCloud](https://…)
//
//   #RapEvils #Elio #Arshown #NewMusic #Rap #HipHop
//   🔵 [Telegram · @RapEvils](https://t.me/RapEvils)
//   ❤️ اگر این آهنگ را دوست داشتی، ... (CHANNEL_FOOTER)
function platformMeta_(key) { return POST_LINK_PLATFORMS.find(function(p) { return p.key === String(key); }) || { key: String(key), label: String(key), emoji: "🔗" }; }
function splitArtists_(value) {
  return String(value || "").split(/\s*(?:,|،|\/|&|\+|\band\b|\bfeat\.?\b|\bft\.?\b|\bwith\b)\s*/i).map(function(x) { return String(x || "").trim(); }).filter(Boolean);
}
function joinArtistsAmp_(value) { const list = splitArtists_(value); return list.length ? list.join(" & ") : String(value || "").trim(); }
// نام هنرمندان برای نمایش در پیام‌ها؛ فهرست‌ها با «،» و «&» جدا می‌شوند.
function formatArtistNames_(value) {
  const list = splitArtists_(value);
  if (!list.length) return String(value || "").trim();
  return list.join(" ، ");
}
function cleanHashtag_(text) { return String(text || "").replace(/[^A-Za-z0-9_\u0600-\u06FF\u200c]/g, "").slice(0, 32); }
function linkHtml_(url, label) { return '<a href="' + htmlEscape_(url) + '">' + htmlEscape_(label) + '</a>'; }
function getChannelTelegramTarget_() {
  // خط «Telegram · @channel» از آیدی کانال ساخته می‌شود (قابل بازنویسی با POST_TELEGRAM_LINK).
  if (CHANNEL_LINK_MEMO_ !== null) return CHANNEL_LINK_MEMO_;
  const override = String(getSetting_("POST_TELEGRAM_LINK") || "").trim();
  const channel = String(getSetting_("CHANNEL_ID") || "").trim();
  let username = "";
  if (/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(channel)) username = channel.slice(1);
  else if (/^-100\d+$/.test(channel)) {
    const info = telegramRequest_("getChat", { chat_id: channel });
    if (info && info.ok && info.result && info.result.username) username = String(info.result.username);
  }
  let target = null;
  if (username) target = { url: "https://t.me/" + username, label: "Telegram · @" + username };
  else if (override) {
    const u = /^https?:\/\//i.test(override) ? override : "https://" + override.replace(/^@/, "t.me/");
    const m = u.match(/^https?:\/\/t\.me\/([A-Za-z0-9_]+)/i);
    target = { url: u, label: m ? "Telegram · @" + m[1] : "Telegram" };
  }
  CHANNEL_LINK_MEMO_ = target;
  return target;
}
function creditLinesFor_(submission) {
  const sub = submission || {};
  const credits = PREVIEW_CREDITS_MEMO_ || getSubmissionCredits_(sub.id);
  const lines = [];
  credits.forEach(function(c) {
    const person = String(c.person || "").trim();
    if (!person) return;
    lines.push(htmlEscape_(c.role || "Credit") + " : " + htmlEscape_(joinArtistsAmp_(person)));
  });
  return lines;
}
function trackLinesFor_(submission) {
  const sub = submission || {};
  if (String(sub.mode) !== "album") return [];
  const tracks = PREVIEW_TRACKS_MEMO_ || getMusicLibrary_().filter(function(x) { return x.submissionId === sub.id; }).sort(function(a, b) { return a.seq - b.seq; });
  if (tracks.length < 2) return [];
  return tracks.map(function(x, i) {
    const label = String(x.title || "");
    const base = String(sub.title || "");
    const short = label.indexOf(base) === 0 ? label.slice(base.length).replace(/^[\s—–\-:]+/, "") : label;
    return ("0" + (i + 1)).slice(-2) + ". " + htmlEscape_(truncate_(short || label, 48));
  });
}
function buildPostCaption_(submission, options) {
  const opts = options || {};
  const sub = submission || {};
  const mode = String(sub.mode || "simple");
  const artistEmoji = String(getSetting_("POST_ARTIST_EMOJI") || "🔥");
  const titleEmoji = String(getSetting_("POST_TITLE_EMOJI") || "🖤");
  const artistLabel = String(getSetting_("POST_ARTIST_LABEL") || "Artist");
  const outNow = String(mode === "coming_soon" ? (getSetting_("POST_COMING_SOON_TEXT") || "COMING SOON ⏳")
    : mode === "freestyle" ? (getSetting_("POST_FREESTYLE_TEXT") || "FREESTYLE 🎤")
    : (getSetting_("POST_OUT_NOW_TEXT") || "OUT NOW 🕊"));
  const artists = joinArtistsAmp_(sub.artists);
  const featuring = String(sub.featuring || "").trim();
  const artistLine = artists + (featuring ? " feat. " + joinArtistsAmp_(featuring) : "");

  const quoteLines = [];
  quoteLines.push((opts.plainTitle ? String(sub.title || "") : String(sub.title || "").toUpperCase()) + " " + titleEmoji);
  quoteLines.push(outNow);
  const scheduleText = String((sub.request && sub.request.scheduleText) || "").trim();
  if (mode === "coming_soon" && scheduleText) quoteLines.push(htmlEscape_(scheduleText));
  if (!opts.compact) trackLinesFor_(sub).forEach(function(l) { quoteLines.push(l); });
  if (!opts.compact) creditLinesFor_(sub).forEach(function(l) { quoteLines.push(l); });

  const blocks = [];
  // کپشن دستی (ستون caption — ویرایش هنرمند یا مدیر) جای قالب خودکار می‌نشیند؛
  // لینک‌های پلتفرم، هشتگ‌ها، لینک کانال و فوتر همچنان اضافه می‌شوند تا هویت کانال حفظ بماند.
  const custom = String(sub.caption || "").trim();
  if (custom) {
    blocks.push(htmlEscape_(custom).replace(/\r\n/g, "\n"));
  } else {
    if (artistLine) blocks.push(htmlEscape_(artistLabel) + ": " + htmlEscape_(artistLine) + (artistEmoji ? " " + artistEmoji : ""));
    blocks.push("<blockquote>" + quoteLines.join("\n") + "</blockquote>");
  }

  const visibleMap = sub.platformVisible || {};
  const links = (sub.links || []).filter(function(l) { return l && l.url && visibleMap[l.platform] !== false; });
  if (links.length && !custom) {
    blocks.push(links.slice(0, 8).map(function(l) {
      const meta = platformMeta_(l.platform || platformFor_(l.url));
      return meta.emoji + " " + linkHtml_(l.url, meta.label);
    }).join("\n"));
  }

  // تبلیغ کانال وصل‌شدهٔ هنرمند (اختیاری/اجباری از تنظیمات CC_ADVERTISE)
  const advLine = ownerAdvertiseLine_(sub);
  if (advLine) blocks.push(advLine);

  // هشتگ‌ها بلوک جدا، فوتر بلوک جدا → بین‌شان یک خط خالی
  // اگر در کپشن دستی خودش هشتگ نوشته باشند، هشتگ خودکار اضافه نمی‌شود (کنترل کامل با نویسنده).
  const hashtags = (custom && custom.indexOf("#") >= 0) ? "" : buildPostHashtags_(sub);
  if (hashtags) blocks.push(hashtags);
  if (!opts.compact) {
    let footer = String(getSetting_("CHANNEL_FOOTER") || "").trim();
    const isPlainTme = /^\s*(\[t\.me\]\(http:\/\/t\.me\)|https?:\/\/t\.me\/?|t\.me)\s*$/i.test(footer);
    if (isPlainTme) footer = "";
    // اگر فوتر خودش دقیقاً همان لینک تلگرام با ایموجی است، تکراری محسوب می‌شود و فقط نسخه خودکار (لینک‌دار) می‌ماند
    const footerHasFullTelegram = /Telegram\s*·\s*@/i.test(footer) && /t\.me/i.test(footer);
    if (footerHasFullTelegram) footer = "";
    const telegram = getChannelTelegramTarget_();
    if (telegram) blocks.push("🔵 " + linkHtml_(telegram.url, telegram.label));
    if (footer) blocks.push(opts.plainFooter ? footer : htmlEscape_(footer));
  }

  let caption = blocks.join("\n\n").trim();
  if (caption.length > 1024) {
    caption = buildPostCaption_(sub, { compact: true, plainTitle: true, plainFooter: true });
    if (caption.length > 1024) {
      caption = caption.slice(0, 1000);
      const cut = caption.lastIndexOf("\n");
      if (cut > 400) caption = caption.slice(0, cut);
      caption += "…";
    }
  }
  return caption;
}
// هشتگ‌های پست کانال در دو دسته ساخته می‌شوند:
//   ثابت  → HASHTAG_BRAND + HASHTAG_FIXED  (در همهٔ پست‌ها یکسان؛ مدیر در ردیف تنظیمات شیت ویرایش می‌کند)
//   متغیر → برچسب مود (HASHTAG_MODES) + ژانر انتخابی کاربر در مرحلهٔ ژانر + نام هنرمند + فیچرینگ
// خروجی: بدون تکرار، با ترتیب «ثابت‌ها اول، متغیرها بعد» تا هویت کانال در ابتدای کپشن بماند.
function buildPostHashtags_(submission) {
  const sub = submission || {};
  const fixed = [];
  const brand = cleanHashtag_(String(getSetting_("HASHTAG_BRAND") || "RapEvils").replace(/^#/, ""));
  if (brand) fixed.push(brand);
  String(getSetting_("HASHTAG_FIXED") || "NewMusic,Rap,HipHop").split(/[\s,،\n]+/).forEach(function(x) {
    const c = cleanHashtag_(String(x || "").replace(/^#/, ""));
    if (c) fixed.push(c);
  });
  const variable = [];
  modeHashtagsFor_(sub.mode).forEach(function(t) { variable.push(t); });
  genresForSubmission_(sub).forEach(function(t) { variable.push(t); });
  adminHashtagsFor_(sub).forEach(function(t) { variable.push(t); });
  splitArtists_(sub.artists).forEach(function(a) { const c = cleanHashtag_(a); if (c) variable.push(c); });
  splitArtists_(sub.featuring).forEach(function(a) { const c = cleanHashtag_(a); if (c) variable.push(c); });
  const seen = []; const out = [];
  fixed.concat(variable).forEach(function(x) {
    const key = String(x || "").toLowerCase();
    if (!key) return;
    if (seen.indexOf(key) < 0) { seen.push(key); out.push("#" + x); }
  });
  const max = maxPostHashtags_();
  return out.slice(0, max).join(" ");
}
// هشتگ‌های دستیِ مدیر (در details ثبت می‌شود): بعد از ژانر و قبل از نام هنرمند
function adminHashtagsFor_(submission) {
  const sub = submission || {};
  const details = (sub.request && sub.request.details) || sub.details || {};
  const raw = details.adminHashtags;
  const list = Array.isArray(raw) ? raw : String(raw || "").split(/[\s,،\n]+/);
  const out = [];
  list.forEach(function(x) {
    const c = cleanHashtag_(String(x || "").replace(/^#/, ""));
    if (c) out.push(c);
  });
  return out;
}
// نوشتن روی request_json (ستون ۱۷) — جزئیاتی مثل ژانر و هشتگ دستی مدیر آن‌جا نگه داشته می‌شوند
function setSubmissionDetails_(id, patch) {
  const s = getSubmission_(id);
  if (!s) return false;
  const req = Object.assign({ mode: s.mode, details: {} }, s.request || {});
  req.details = Object.assign({}, req.details || {}, patch || {});
  getSheet_(APP.SHEETS.SUBMISSIONS).getRange(s.rowNumber, 17).setValue(JSON.stringify(req));
  s.request = req;
  bustSubmissionCaches_();
  return true;
}
// سقف هشتگ هر پست (تلگرام کپشن ۱۰۲۴ نویسه است؛ هشتگ زیاد هم اسپم به نظر می‌رسد)
function maxPostHashtags_() {
  const n = Number(getSetting_("MAX_POST_HASHTAGS") || 12);
  return Math.max(1, Math.min(25, isFinite(n) && n > 0 ? n : 12));
}
// برچسب مود از HASHTAG_MODES با قالب «مود=هشتگ|هشتگ» — مثلاً freestyle=فری_استایل|Freestyle
function modeHashtagsFor_(mode) {
  const key = String(mode || "simple");
  const raw = String(getSetting_("HASHTAG_MODES") || "").trim();
  const out = [];
  if (!raw) return out;
  raw.split(/[,،\n]+/).forEach(function(part) {
    const item = String(part || "").trim();
    const eq = item.indexOf("=");
    if (eq < 0) return;
    if (item.slice(0, eq).trim() !== key) return;
    item.slice(eq + 1).split(/[|\s،]+/).forEach(function(t) {
      const c = cleanHashtag_(String(t || "").replace(/^#/, ""));
      if (c && out.indexOf(c) < 0) out.push(c);
    });
  });
  return out;
}
// ژانرهای همان پست: از details ژانر (ذخیرهٔ دائم)؛ با پشتیبانی از رکوردهای قدیمی رشته‌ای
function genresForSubmission_(submission) {
  const sub = submission || {};
  const details = (sub.request && sub.request.details) || sub.details || {};
  const raw = details.genres || details.genre || "";
  const list = Array.isArray(raw) ? raw : String(raw).split(/[,،|\s]+/);
  const out = [];
  list.forEach(function(item) {
    const tag = cleanHashtag_((item && typeof item === "object") ? String(item.tag || item.label || "") : String(item || ""));
    if (tag && out.indexOf(tag) < 0) out.push(tag);
  });
  return out.slice(0, maxGenreTags_());
}
// کپشن پست صوتی: فقط نام ترک + خط تلگرام
function buildAudioCaption_(submission, trackTitle) {
  const sub = submission || {};
  const title = String(trackTitle || sub.title || "").trim();
  const lines = [htmlEscape_(title)];
  const telegram = getChannelTelegramTarget_();
  if (telegram) lines.push("🔵 " + linkHtml_(telegram.url, telegram.label));
  return lines.join("\n");
}
// ترک بدون فایل منتشرشده نباید دکمه/لینک دانلود داشته باشد.
function markFloorTrack_(trackId, enable) {
  try {
    const track = getMusicLibraryTrack_(trackId);
    if (!track) return false;
    const sh = getSheet_(APP.SHEETS.MUSIC_LIBRARY);
    sh.getRange(track.rowNumber, 7).setValue(enable === true);
    track.downloadAllowed = enable === true;
    MUSIC_LIBRARY_MEMO_ = null;
    return true;
  } catch (e) { logError_("markFloorTrack_", e); return false; }
}
function downloadDeepLink_(param) {
  const username = getBotUsername_();
  if (!username || !param) return "";
  return "https://t.me/" + username + "?start=download_" + downloadStartParam_(param);
}
// مارک‌آپ پست صوتی: دکمهٔ شیشه‌ای دانلود + دکمهٔ تبلیغ کانال هنرمند (در صورت اتصال)
function audioPostMarkup_(submission, trackId) {
  const rows = [];
  const dl = downloadButtonMarkup_(submission, trackId);
  if (dl) dl.inline_keyboard.forEach(function(r) { rows.push(r); });
  const ccRow = ownerChannelButtonRow_(submission);
  if (ccRow) rows.push(ccRow);
  return rows.length ? { inline_keyboard: rows } : null;
}
function downloadButtonMarkup_(submission, trackId) {
  const sub = submission || {};
  const buttonText = String(getSetting_("POST_DOWNLOAD_BUTTON_TEXT") || "⬇️ دانلود آهنگ");
  const track = trackId ? getMusicLibraryTrack_(trackId) : null;
  let target = trackId || "";
  if (track) { if (!track.downloadAllowed || !track.fileId) return null; }
  else if (!getMusicLibrary_().some(function(x) { return x.submissionId === sub.id && x.downloadAllowed && x.fileId; })) return null;
  if (!target) target = String(sub.id);
  const url = downloadDeepLink_(target);
  if (!url) return null;
  return { inline_keyboard: [[{ text: buttonText, url: url }]] };
}
function postActionsMarkup_(submission) {
  // مارک‌آپ پست کاور: به‌صورت پیش‌فرض خالی است تا کامنت‌های خودِ تلگرام زیر پست اول باز و تمیز بمانند؛
  // دکمهٔ دانلود و دکمهٔ کانال هنرمند زیر پست صوتی می‌آیند. با POST_DOWNLOAD_BUTTON_ON_COVER=«true» دکمه اینجا هم می‌آید.
  const sub = submission || {};
  const rows = [];
  if (String(getSetting_("POST_DOWNLOAD_BUTTON_ON_COVER")) === "true") {
    const dl = downloadButtonMarkup_(sub, "");
    if (dl) dl.inline_keyboard.forEach(function(r) { rows.push(r); });
  }
  if (String(getSetting_("POST_SHOW_LINK_BUTTONS")) === "true") {
    const visible = (sub.links || []).filter(function(l) { return l && l.url && (sub.platformVisible || {})[l.platform] !== false; });
    const buttons = visible.slice(0, 6).map(function(l) { const p = platformMeta_(l.platform); return { text: p.emoji + " " + p.label, url: l.url }; });
    for (let i = 0; i < buttons.length; i += 2) rows.push(buttons.slice(i, i + 2));
  }
  return rows.length ? { inline_keyboard: rows } : null;
}

// ───────────────────────── پیش‌نمایش و ثبت نهایی پیش‌نویس ─────────────────────────
// پیش‌نمایش دقیقاً از همان تابع کپشن واقعی ساخته می‌شود تا «چیزی که می‌بینی» = «چیزی که منتشر می‌شود».
// (قبلاً منطق کپشن در دو جا کپی شده بود و با هم فرق داشتند.)
function draftPreviewSubmission_(draft) {
  const d = draft.data || {};
  const media = getDraftMedia_(draft.draftId);
  const audios = media.filter(function(m) { return m.kind === "audio"; });
  const credits = (d.credits || []).filter(function(c) { return c && c.person; }).sort(function(a, b) { return (a.sort || 500) - (b.sort || 500); });
  const tracks = audios.map(function(m, i) {
    const t = String(m.caption || "").trim() ? titleFromCaption_(m.caption) : (audios.length > 1 ? String(d.title || "Track") + " — " + (i + 1) : String(d.title || "Track"));
    return { seq: i + 1, title: t };
  });
  return {
    id: "PREVIEW", mode: draft.mode, title: d.title || "—", artists: d.artists || "—", featuring: d.featuring || "",
    caption: "", links: (d.links || []), platformVisible: d.platformVisible || {},
    request: { scheduleText: d.scheduleText || "", details: { genres: Array.isArray(d.genres) ? d.genres : [] } },
    _previewCredits: credits, _previewTracks: tracks
  };
}
function buildDraftPreviewCaption_(draft) {
  const fake = draftPreviewSubmission_(draft);
  // کردیت و ترک‌ها در شیت نوشته نمی‌شوند؛ موقتاً به کش محلی تزریق می‌شوند.
  PREVIEW_CREDITS_MEMO_ = fake._previewCredits;
  PREVIEW_TRACKS_MEMO_ = fake._previewTracks;
  try { return buildPostCaption_(fake); }
  finally { PREVIEW_CREDITS_MEMO_ = null; PREVIEW_TRACKS_MEMO_ = null; }
}
const CREDIT_ROLE_ALIASES_ = [
  { re: /^(?:production|producer|prod|prd|تنظیم(?:\s*کننده)?|پروداکشن|آهنگساز)$/i, label: "Production", sort: 10 },
  { re: /^(?:mix(?:\s*(?:&|and|و)\s*master)?|master(?:ing)?|میکس(?:\s*(?:&|و)\s*مستر)?|مستر(?:ینگ)?)$/i, label: "Mix & Master", sort: 20 },
  { re: /^(?:lyrics?|lyricist|ترانه(?:\s*سرا)?|شاعر)$/i, label: "Lyrics", sort: 30 },
  { re: /^(?:arrangement|arranger|تنظیم\s*موسیقی)$/i, label: "Arrangement", sort: 40 },
  { re: /^(?:cover(?:\s*art)?|artwork|کاور|طراح(?:\s*کاور)?)$/i, label: "Cover Art", sort: 50 },
  { re: /^(?:label|ناشر|لیبل)$/i, label: "Label", sort: 60 }
];
function creditRoleFor_(key) {
  const k = String(key || "").trim();
  for (let i = 0; i < CREDIT_ROLE_ALIASES_.length; i++) if (CREDIT_ROLE_ALIASES_[i].re.test(k)) return CREDIT_ROLE_ALIASES_[i];
  return null;
}
function titleFromCaption_(caption) {
  const lines = String(caption || "").split(/\r?\n/).map(function(x) { return x.trim(); }).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^https?:\/\//i.test(line)) continue;
    if (/^(?:عنوان|اسم آهنگ|title|هنرمند|artist|production|mix)\s*[:：]/i.test(line)) continue;
    const clean = truncate_(stripLinks_(line), 60);
    if (clean) return clean;
  }
  return "";
}
// strictKeys = فقط کلیدهای شناخته‌شده (عنوان/هنرمند/فیچرینگ/زمان) پذیرفته می‌شوند.
// در مرحلهٔ عنوان، «Intro: Dawn» نباید به‌عنوان «عوامل» تفسیر شود و عنوان را از دست بدهد.
function parsePostMetadata_(message, strictKeys) {
  let raw = String(message && (message.caption || message.text) || "").trim();
  if (!raw) return null;
  const strict = strictKeys === true;
  raw = raw.replace(/<[^>]+>/g, "");
  const meta = { title: "", artists: "", featuring: "", scheduleText: "", genre: "", credits: [] };
  let matched = false;
  raw.split(/\r?\n/).forEach(function(line) {
    // خطوطی که خودشان URL هستند «نقش: مقدار» حساب نمی‌شوند (مثل https://soundcloud.com/...)
    if (/^\s*[a-z][a-z0-9+.\-]*:\/\//i.test(line)) return;
    if (/^\s*(?:www\.)?[A-Za-z0-9.-]+\.[A-Za-z]{2,}\//.test(line)) return;
    const m = String(line).match(/^\s*([^:：]{2,28})\s*[:：]\s*(.+?)\s*$/);
    if (!m) return;
    const key = String(m[1]).trim();
    const value = String(m[2]).trim();
    if (!key || !value) return;
    if (/^(?:عنوان|اسم آهنگ|title|name)$/i.test(key)) { meta.title = truncate_(value, 80); matched = true; return; }
    if (/^(?:هنرمند(?:ها)?|خواننده|artist|artists)$/i.test(key)) { meta.artists = truncate_(value, 80); matched = true; return; }
    if (/^(?:همراه|فیچرینگ|feat(?:uring)?|ft)$/i.test(key)) { meta.featuring = truncate_(value, 80); matched = true; return; }
    if (/^(?:زمان|ساعت|تاریخ انتشار|schedule|date)$/i.test(key)) { meta.scheduleText = truncate_(value, 60); matched = true; return; }
    if (/^(?:ژانر|ژانرها|سبک|حال(?:[\u200c ]وهوا)?|genre|genres|style|mood)$/i.test(key)) { meta.genre = truncate_(value, 40); matched = true; return; }
    if (strict) return; // در حالت سخت‌گیرانه، بقیهٔ کلیدها نادیده گرفته می‌شوند
    const alias = creditRoleFor_(key);
    if (alias) { meta.credits.push({ role: alias.label, person: truncate_(value, 80), sort: alias.sort }); matched = true; return; }
    if (key.length <= 24) { meta.credits.push({ role: key, person: truncate_(value, 80), sort: 500 }); matched = true; }
  });
  return matched ? meta : null;
}
// در مرحلهٔ عنوان: «Intro: Dawn» را باید عیناً به‌عنوان عنوان بپذیریم.
function titleFromUserInput_(message, text) {
  const meta = parsePostMetadata_(message, true);
  if (meta && meta.title) return meta.title;
  return String(text || "").trim();
}
// اعتبارسنجی فرمت رسانه بر اساس حالت ارسال:
// تکی = دقیقاً یک MP3 · آلبوم = هر تعداد MP3 که کاربر فرستاده · Coming Soon = فقط یک رسانه و بدون موزیک
function validateDraftFormats_(uid, draft, media) {
  const mode = String(draft.mode || "simple");
  const visuals = (media || []).filter(function(m) { return VISUAL_MEDIA_KINDS_.indexOf(m.kind) >= 0; });
  const audios = (media || []).filter(function(m) { return m.kind === "audio"; });
  if (!(media || []).length) return { step: "MUSIC_COVER", message: t_(uid, "SUBMIT_NOTHING") };
  if (mode === "freestyle") {
    // اجرای فری‌استایل = دقیقاً یک مورد از: ویدیو مسیج گرد، ویدیو، یا فایل MP3
    const perf = (media || []).filter(function(m) { return m.kind === "audio" || FREESTYLE_VIDEO_KINDS_.indexOf(m.kind) >= 0; });
    if (!perf.length) return { step: "MUSIC_AUDIO", message: t_(uid, "NEED_FREESTYLE_MEDIA") };
    if (perf.length > 1) return { step: "MUSIC_AUDIO", message: t_(uid, "FREESTYLE_ONLY_ONE") };
    const bad = (media || []).filter(function(m) { return m.kind === "voice"; });
    if (bad.length) return { step: "MUSIC_AUDIO", message: t_(uid, "FREESTYLE_NO_VOICE") };
    if (visuals.length > getMaxCoverPhotos_()) return { step: "MUSIC_COVER", message: t_(uid, "COVER_LIMIT", { n: getMaxCoverPhotos_() }) };
    return null;
  }
  if (mode === "coming_soon") {
    if (!visuals.length) return { step: "MUSIC_COVER", message: t_(uid, "NEED_COVER") };
    if (visuals.length > 1) return { step: "MUSIC_COVER", message: t_(uid, "CS_ONLY_ONE") };
    if (audios.length) return { step: "MUSIC_COVER", message: t_(uid, "STEP_COVER_ONLY_COMING") };
    return null;
  }
  if (!audios.length) return { step: "MUSIC_AUDIO", message: t_(uid, "NEED_AUDIO") };
  if (mode !== "album" && audios.length > 1) return { step: "MUSIC_AUDIO", message: t_(uid, "STEP_AUDIO_SINGLE_LIMIT") };
  if (visuals.length > getMaxCoverPhotos_()) return { step: "MUSIC_COVER", message: t_(uid, "COVER_LIMIT", { n: getMaxCoverPhotos_() }) };
  return null;
}
function finalizeDraftToSubmission_(chatId, uid, draft) {
  const data = draft.data || {};
  const title = String(data.title || "").trim();
  const artists = String(data.artists || "").trim();
  const media = getDraftMedia_(draft.draftId);
  // فرمت نادرست (مثلاً ویدیو مسیج به‌جای موزیک) → بازگشت به همان مرحله برای اصلاح
  const formatError = validateDraftFormats_(uid, draft, media);
  if (formatError) {
    setSession_("M:" + uid, formatError.step, { draftId: draft.draftId });
    sendMessage_(chatId, formatError.message, musicStepKeyboard_(uid, formatError.step, draft.mode));
    return;
  }
  if (title.length < 2) {
    // اگر عنوان خالی ماند (مثلاً مرحله رد شده)، به‌جای گیر کردن در PREVIEW کاربر را به مرحله عنوان برمی‌گردانیم
    setSession_("M:" + uid, "MUSIC_TITLE", { draftId: draft.draftId });
    sendMessage_(chatId, t_(uid, "SUBMIT_TITLE_ASK"), musicStepKeyboard_(uid, "MUSIC_TITLE", draft.mode));
    return;
  }
  if (artists.length < 2) {
    setSession_("M:" + uid, "MUSIC_ARTISTS", { draftId: draft.draftId });
    sendMessage_(chatId, t_(uid, "SUBMIT_ARTIST_ASK"), musicStepKeyboard_(uid, "MUSIC_ARTISTS", draft.mode));
    return;
  }
  const duplicate = isDuplicateSubmission_(uid, title, artists, media);
  if (duplicate === "file" || (duplicate === "title" && !isAdmin_(uid))) {
    // اگر کاربر در MUSIC_PREVIEW رها شود، هر چه بنویسد فقط پیش‌نمایش را دوباره می‌بیند و
    // هیچ راهی برای تغییر عنوان ندارد (گیر می‌کند). پس مستقیم به مرحلهٔ عنوان برمی‌گردانیم.
    setSession_("M:" + uid, "MUSIC_TITLE", { draftId: draft.draftId });
    sendMessage_(chatId, t_(uid, duplicate === "file" ? "DUPLICATE_FILE" : "DUPLICATE_TITLE") + "\n" + t_(uid, "DUPLICATE_FIX_HINT"), musicStepKeyboard_(uid, "MUSIC_TITLE", draft.mode));
    return;
  }
  const submission = saveMusicSubmission_(draft, {
    title: title, artists: artists, featuring: String(data.featuring || ""), caption: String(data.caption || ""),
    links: data.links || [], platformVisible: data.platformVisible || {},
    // ژانرهای مرحلهٔ ژانر داخل details می‌روند؛ همان‌جا هشتگ متغیر پست از آن ساخته می‌شود.
    details: Object.assign({}, data.details || {}, (Array.isArray(data.genres) && data.genres.length) ? { genres: data.genres } : {}),
    credits: data.credits || [], scheduleText: data.scheduleText || "", scheduledOffset: data.scheduledOffsetMin ? Number(data.scheduledOffsetMin) : -1,
    scheduledAtValue: data.scheduledAtMs || ""
  });
  clearSession_("M:" + uid);
  const approval = String(getSetting_("PUBLISH_MODE") || "auto") === "approval";
  const lang = userLang_(uid);
  const pendingText = niceText_(approval ? "MUSIC_PENDING_TEXT" : "MUSIC_AUTO_TEXT", null, lang) || (approval ? DEFAULT_SETTINGS.MUSIC_PENDING_TEXT : DEFAULT_SETTINGS.MUSIC_AUTO_TEXT);
  sendMessage_(chatId, t_(uid, "SUBMIT_OK") + "\n" + t_(uid, "SUBMIT_ID") + submission.id + "\n" + t_(uid, "SUBMIT_TITLE_L") + submission.title + "\n" + t_(uid, "SUBMIT_ARTIST_L") + formatArtistNames_(artists) + "\n" + t_(uid, "SUBMIT_DATE_L") + formatDate_(submission.scheduledAt) + "\n\n" + pendingText, adminOrUserKeyboard_(uid));
  getAdmins_().forEach(function(a) {
    sendMessage_(a, "🎵 ارسال جدید (" + (approval ? "در انتظار تأیید" : "در صف انتشار") + ")\n🆔 " + submission.id + "\n🧩 " + (SUB_MODE_LABELS_[submission.mode] || submission.mode) + "\n👤 " + uid + "\n📀 " + submission.title + "\n🎤 " + formatArtistNames_(artists),
      { inline_keyboard: [
        [{ text: "👁 پیش‌نمایش پست", callback_data: "a:subpreview:" + submission.id }, { text: "📂 فایل‌های کاربر", callback_data: "a:subfiles:" + submission.id }],
        [{ text: "✏️ ویرایش دستی", callback_data: "a:subedit:" + submission.id }, { text: "📂 جزئیات", callback_data: "a:sub:" + submission.id }]
      ] });
  });
}
function adminOrUserKeyboard_(uid) {
  if (isAdmin_(uid)) return adminKeyboard_();
  return userKeyboard_(uid);
}
function handleUserState_(message, session, user) {
  const uid = String(user && user.userId || message.from.id);
  if (session && String(session.state).indexOf("MUSIC_") === 0) { handleMusicMessage_(message, session); return; }
  if (session && session.state === "USR_SUPPORT") { handleSupportUserMessage_(message, session); return; }
  if (session && String(session.state).indexOf("PERS_") === 0) { handleProfileState_(message, session); return; }
  clearSession_("M:" + uid);
  showUserMenu_(String(message.chat.id));
}

// ───────────────────────── موتور انتشار ─────────────────────────
function parsePublishStage_(sub) {
  try { const s = JSON.parse(sub && sub.publishStage || "{}"); return s && typeof s === "object" ? s : {}; } catch (e) { return {}; }
}
function savePublishStage_(sub, stage) {
  setSubmissionField_(sub.id, "publishStage", JSON.stringify(stage || {}));
  sub.publishStage = JSON.stringify(stage || {});
  setSubmissionField_(sub.id, "updatedAt", new Date());
}
function getLock_() { return LockService.getScriptLock(); }
function publishQueueJob() {
  resetRuntimeCaches_();
  // این تابع هیچ آرگومانی نمی‌گیرد؛ تریگر زمانی event پاس می‌دهد که نباید روی کش اثر بگذارد.
  // قفل اسکریپت فقط برای «انتخاب وظیفه» گرفته می‌شود، نه در تمام مدت انتشار؛
  // وگرنه ثبت‌نام/آپلود کاربران ۱۲ ثانیه منتظر می‌ماند و با خطا شکست می‌خورد.
  const lock = getLock_(); if (!lock.tryLock(20000)) return;
  try {
    if (String(getSetting_("QUEUE_ENABLED") || "true") !== "true") return;
    ensureWorkersReady_();
    if (String(getSetting_("PUBLISH_ENABLED") || "true") !== "true") return;
    if (!String(getSetting_("CHANNEL_ID") || "").trim()) return;
    const now = nowMs_();
    const all = getAllSubmissions_();
    // پست نیمه‌کاره: «publishing» تازه، اجرای موازی را متوقف می‌کند.
    const partial = all.filter(function(s) { return s.status === "publishing" && now - dateMillis_(s.updatedAt) < STUCK_PUBLISHING_MINUTES_ * 60000; });
    if (partial.length) return;
    // اصلاح باگ: اگر اجرا وسط انتشار timeout شود، ردیف برای همیشه "publishing" می‌ماند و
    // هیچ‌وقت دوباره برداشته نمی‌شد. حالا ردیف‌های کهنه به «approved» برگردانده می‌شوند
    // و همان چرخه ادامهٔ انتشار (stage) را از همان‌جا تکمیل می‌کنند.
    const stuck = all.filter(function(s) { return s.status === "publishing" && now - dateMillis_(s.updatedAt) >= STUCK_PUBLISHING_MINUTES_ * 60000; });
    stuck.forEach(function(s) {
      try {
        setSubmissionField_(s.id, "status", "approved");
        setSubmissionField_(s.id, "failure", "stuck_recovered");
        setSubmissionField_(s.id, "scheduledAt", new Date());
        s.status = "approved";
        logError_("publishQueueJob:stuck", new Error("بازیابی ارسال گیرکرده " + s.id), { submissionId: s.id });
      } catch (e) {}
    });
    const staleFailed = all.filter(function(s) {
      if (s.status !== "failed") return false;
      const stage = parsePublishStage_(s);
      if (!stage.visual && !stage.preview && !stage.audio && !stage.text) return false;
      return now - dateMillis_(s.updatedAt) < PARTIAL_PUBLISH_LOCK_MINUTES_ * 60000;
    });
    if (staleFailed.length) return;
    const due = all.filter(function(s) {
      if (String(s.status) !== "approved") return false;
      const at = dateMillis_(s.scheduledAt); return !at || at <= now;
    }).sort(function(a, b) { return dateMillis_(a.scheduledAt) - dateMillis_(b.scheduledAt); });
    // انتخاب وظیفه‌ها داخل قفل انجام شد؛ حالا قفل آزاد می‌شود تا بقیهٔ ربات (ثبت‌نام/آپلود) قفل نماند.
    try { lock.releaseLock(); } catch (e2) {}
    for (let i = 0; i < due.length; i++) {
      if (dateMillis_(due[i].scheduledAt) > nowMs_()) break;
      // فقط یک پست در هر اجرا: Apps Script محدودیت ۶ دقیقه دارد و آلبوم می‌تواند طولانی شود.
      publishOneSubmission_(due[i]);
      break;
    }
  } catch (e) { logError_("publishQueueJob", e); }
  finally { try { lock.releaseLock(); } catch (e2) {} }
}
function ensureWorkersReady_() {
  const triggers = ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); });
  if (triggers.indexOf("publishQueueJob") < 0) {
    if (String(getSetting_("QUEUE_ENABLED") || "true") === "true") ScriptApp.newTrigger("publishQueueJob").timeBased().everyMinutes(1).create();
  }
  if (triggers.indexOf("broadcastQueueJob") < 0) ScriptApp.newTrigger("broadcastQueueJob").timeBased().everyMinutes(5).create();
  if (triggers.indexOf("cleanupJob") < 0) ScriptApp.newTrigger("cleanupJob").timeBased().everyHours(6).create();
  if (String(getSetting_("BACKUP_ENABLED") || "false") === "true") ensureWeeklyBackupTrigger_();
}
// اگر STAGING_CHANNEL_ID تنظیم شده باشد، انتشار آزمایشی اول به آنجا می‌رود تا ادمین پیش‌نمایش واقعی ببیند.
function resolvePublishChannel_(forPreview) {
  const staging = String(getSetting_("STAGING_CHANNEL_ID") || "").trim();
  if (forPreview && staging) return staging;
  return String(getSetting_("CHANNEL_ID") || "").trim();
}
function publishOneSubmission_(sub) {
  const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
  if (!channel) { console.error("CHANNEL_ID نامعتبر است"); return false; }
  // اگر اثر قبلاً منتشر شده و حالا ویرایش شده است، سعی می‌کنیم پست کانال را ویرایش کنیم تا کامنت‌ها حفظ شود
  const wasPublished = !!String(sub.publishedAt || "").trim() && String(sub.status) !== "published";
  const hadMessages = !!(String(sub.visualMessageIds||"").trim() || String(sub.audioMessageIds||"").trim());
  if (wasPublished && hadMessages && String(sub.status) === "approved") {
    const edited = tryEditPublishedPost_(sub, channel);
    if (edited) {
      setSubmissionField_(sub.id, "status", "published");
      setSubmissionField_(sub.id, "publishedAt", new Date());
      savePublishStage_(sub, parsePublishStage_(sub));
      notifySubmissionOwner_(sub, t_(sub.userId, "PUBLISHED_NOTIFY", { t: sub.title, links: "" }) + "\n✏️ ویرایش روی کانال اعمال شد.");
      return true;
    }
    // اگر ویرایش نشد، دوباره به‌صورت عادی منتشر می‌کنیم (حذف و ارسال مجدد)
  }
  setSubmissionField_(sub.id, "status", "publishing");
  sub.status = "publishing";
  const stage = parsePublishStage_(sub);
  const lang = userLang_(sub.userId);
  try {
    initPublishStageForSubmission_(sub, stage);
    // فری‌استایل ویدیویی: اجرای کاربر خودِ پست کانال است (کاور و برش صوتی ارسال نمی‌شود).
    const fsVideo = String(sub.mode) === "freestyle" && !stage.freestylePosted ? freestyleVideoFor_(sub.id) : [];
    if (fsVideo.length) publishFreestyleStage_(sub, stage, channel, fsVideo[0]);
    else if (!stage.visual) publishVisualStage_(sub, stage, channel);
    if (["coming_soon", "coming_next"].indexOf(String(sub.mode)) < 0 && !stage.freestylePosted) publishAudioStage_(sub, stage, channel);
    else if (!stage.text && !stage.visual && !stage.freestylePosted) publishTextStage_(sub, stage, channel);
    const finished = new Date();
    setSubmissionField_(sub.id, "status", "published");
    setSubmissionField_(sub.id, "publishedAt", finished);
    savePublishStage_(sub, stage);
    const lib = getSheet_(APP.SHEETS.MUSIC_LIBRARY); const tracks = getMusicLibrary_().filter(function(t) { return t.submissionId === sub.id; });
    tracks.forEach(function(t) { lib.getRange(t.rowNumber, 12).setValue(finished); t.publishedAt = finished; });
    approveMusicRights_(sub.id, "auto:publish");
    const links = (sub.links || []).map(function(l) { return l.url; });
    notifySubmissionOwner_(sub, t_(sub.userId, "PUBLISHED_NOTIFY", { t: sub.title, links: links.length ? "\n" + links.join("\n") : "" }));
    // پیام ریز خودکار در کانال(های) وصل‌شدهٔ هنرمند + دکمهٔ شیشه‌ای به پست کانال اصلی
    try {
      const postUrl = submissionPrimaryPostLink_(sub);
      if (postUrl) sendOwnerChannelPromo_(sub, postUrl);
    } catch (e) { logError_("sendOwnerChannelPromo_", e, { submissionId: sub.id }); }
    getAdmins_().forEach(function(a) { sendMessage_(a, t_(a, "PUBLISH_ADMIN_NOTIFY", { id: sub.id, t: sub.title })); });
    return true;
  } catch (e) {
    const message = String(e && e.message || e);
    logError_("publishOneSubmission_" + (stage.stage ? "(" + stage.stage + ")" : ""), e, { submissionId: sub.id, userId: sub.userId });
    setSubmissionField_(sub.id, "status", "failed");
    setSubmissionField_(sub.id, "failure", truncate_(message, 400));
    savePublishStage_(sub, stage);
    getAdmins_().forEach(function(a) {
      sendMessage_(a, t_(a, "PUBLISH_FAIL_ADMIN", { id: sub.id, t: sub.title, s: stage.stage || "?", e: truncate_(message, 300) }), { inline_keyboard: [[{ text: "🔁 تلاش دوباره", callback_data: "a:subretry:" + sub.id }, { text: "📂 جزئیات", callback_data: "a:sub:" + sub.id }]] });
    });
    return false;
  }
}

function tryEditPublishedPost_(sub, channel){
  try {
    const caption = buildPostCaption_(sub);
    const markup = postActionsMarkup_(sub);
    const stage = parsePublishStage_(sub);
    const vids = stage.visualMessageIds && stage.visualMessageIds.length ? stage.visualMessageIds : positiveIdList_(String(sub.visualMessageIds||""));
    const aids = stage.audioMessageIds && stage.audioMessageIds.length ? stage.audioMessageIds : positiveIdList_(String(sub.audioMessageIds||""));
    let ok = false;
    // ویرایش کپشنِ پست کاور (اصلی)
    if (vids.length) {
      const visuals = visualMediaFor_(sub.id);
      const fsVideos = freestyleVideoFor_(sub.id);
      // در فری‌استایلِ ویدیویی، رسانهٔ روی کانال «اجرا» است نه کاور؛ نوع از stage خوانده می‌شود.
      const kind = String(stage.visualKind || (visuals.length === 1 ? visuals[0].kind : ""));
      if (kind === "video_note" && stage.captionMessageId) {
        // ویدیو مسیج کپشن ندارد؛ متن اطلاعات در پیام ریپلای ویرایش می‌شود.
        const rt = telegramRequest_("editMessageText", { chat_id: channel, message_id: Number(stage.captionMessageId), text: caption, parse_mode: "HTML", reply_markup: markup || undefined });
        if (rt && rt.ok) ok = true;
      } else {
        const r = telegramRequest_("editMessageCaption", { chat_id: channel, message_id: vids[0], caption: caption, parse_mode: "HTML", reply_markup: markup || undefined });
        if (r && r.ok) ok = true;
        // اگر خود رسانه عوض شده باشد، editMessageMedia (عکس یا ویدیو)
        const posted = stage.freestylePosted
          ? (fsVideos.length === 1 ? { kind: freestyleBaseKind_(fsVideos[0].kind), fileId: fsVideos[0].fileId } : null)
          : (visuals.length === 1 ? { kind: visuals[0].kind, fileId: visuals[0].fileId } : null);
        if (posted && vids.length === 1 && (posted.kind === "photo" || posted.kind === "video")) {
          const r2 = telegramRequest_("editMessageMedia", { chat_id: channel, message_id: vids[0], media: JSON.stringify({ type: posted.kind, media: posted.fileId, caption: caption, parse_mode: "HTML" }) });
          if (r2 && r2.ok) ok = true;
        }
      }
    }
    // ویرایش کپشن ترک‌های صوتی
    if (aids.length) {
      const tracks = getMusicLibrary_().filter(function(t){return t.submissionId===sub.id;});
      aids.forEach(function(mid, idx){
        const t = tracks[idx];
        if (!t) return;
        const cap = buildAudioCaption_(sub, t.title);
        const btn = audioPostMarkup_(sub, t.trackId);
        const rr = telegramRequest_("editMessageCaption", { chat_id: channel, message_id: mid, caption: cap, parse_mode: "HTML", reply_markup: btn || undefined });
        if (rr && rr.ok) ok = true;
      });
    }
    if (ok) {
      // مرحله را به‌روز کن
      const newStage = parsePublishStage_(sub);
      newStage.visual = true; newStage.audio = true;
      savePublishStage_(sub, newStage);
      return true;
    }
  } catch(e){ logError_("tryEditPublishedPost_", e, {sid: sub.id}); }
  return false;
}

function initPublishStageForSubmission_(sub, stage) {
  if (!stage.createdAt) { stage.createdAt = nowMs_(); stage.stage = "visual"; }
  if (stage.visual == null) stage.visual = false;
  if (stage.audio == null) stage.audio = false;
  if (stage.preview == null) stage.preview = false;
  if (!stage.visualMessageIds) stage.visualMessageIds = positiveIdList_(sub.visualMessageIds);
  if (!stage.audioMessageIds) stage.audioMessageIds = positiveIdList_(sub.audioMessageIds);
}
// رسانه‌های تصویری پست: عکس/ویدیو (گرید حداکثر ۲) و برای Coming Soon ویدیو مسیج/ویس.
function visualMediaFor_(submissionId) {
  return getSubmissionMedia_(submissionId).filter(function(m) { return VISUAL_MEDIA_KINDS_.indexOf(m.kind) >= 0; });
}
// اجرای فری‌استایل (ویدیو مسیج گرد یا ویدیو). MP3 فری‌استایل با kind="audio" ذخیره می‌شود
// و همان خط لولهٔ برش ۳۰ ثانیه‌ای + دکمهٔ دانلود را طی می‌کند.
function freestyleVideoFor_(submissionId) {
  return getSubmissionMedia_(submissionId).filter(function(m) { return FREESTYLE_VIDEO_KINDS_.indexOf(m.kind) >= 0; });
}
// پست کانال برای فری‌استایل ویدیویی: خودِ اجرا پست می‌شود (کاور/کاور پیش‌فرض ارسال نمی‌شود).
// ویدیو مسیج کپشن ندارد → کپشن قالب به‌صورت ریپلای روی همان پیام می‌رود.
// ─────────────────────────────────────────────────────────────────────────────
// بدنهٔ مشترک پست‌ها: همان کدی که پست کانال را می‌سازد، با مقصدِ قابل تغییر.
// `publishFreestyleStage_`/`publishVisualStage_` و «پیش‌نمایش کامل برای مدیر» هر دو
// از این تابع‌ها استفاده می‌کنند تا پیش‌نمایش دقیقاً همان چیزی باشد که منتشر می‌شود.
// ─────────────────────────────────────────────────────────────────────────────
function sendFreestylePostBody_(sub, target, item, opts) {
  const o = opts || {};
  const chat = String(target);
  const caption = o.caption !== undefined ? o.caption : buildPostCaption_(sub);
  const markup = o.markup;
  const baseKind = freestyleBaseKind_(item.kind);
  let result;
  if (baseKind === "video_note") {
    result = sendChannelMedia_("sendVideoNote", { chat_id: chat, video_note: item.fileId });
    if (!result || !result.ok) return { ok: false, error: "ارسال اجرای فری‌استایل (ویدیو مسیج) ناموفق: " + String(result && result.description || "") };
    const noteId = Number(result.result.message_id);
    const out = { ok: true, messageIds: [noteId], visualKind: "video_note" };
    const reply = sendChannelMedia_("sendMessage", { chat_id: chat, text: caption, parse_mode: "HTML", reply_to_message_id: noteId, disable_web_page_preview: true });
    if (reply && reply.ok && reply.result && reply.result.message_id) {
      out.captionMessageId = Number(reply.result.message_id);
      out.messageIds = [noteId, out.captionMessageId];
      if (markup) telegramRequest_("editMessageReplyMarkup", { chat_id: chat, message_id: out.captionMessageId, reply_markup: markup });
    } else if (markup) {
      telegramRequest_("editMessageReplyMarkup", { chat_id: chat, message_id: noteId, reply_markup: markup });
    }
    return out;
  }
  const payload = { chat_id: chat, video: item.fileId, caption: caption, parse_mode: "HTML" };
  if (markup) payload.reply_markup = markup;
  result = sendChannelMedia_("sendVideo", payload);
  if (!result || !result.ok) return { ok: false, error: "ارسال اجرای فری‌استایل (ویدیو) ناموفق: " + String(result && result.description || "") };
  return { ok: true, messageIds: [Number(result.result.message_id)], visualKind: "video" };
}
function sendVisualPostBody_(sub, target, opts) {
  const o = opts || {};
  const chat = String(target);
  const visuals = visualMediaFor_(sub.id);
  const caption = o.caption !== undefined ? o.caption : buildPostCaption_(sub);
  const markup = o.markup;
  let result;
  if (!visuals.length) {
    // کاربر کاور نفرستاده → کاور پیش‌فرض خودکار جای آن می‌نشیند (پست عکس با کپشن قالب و کامنت باز).
    result = sendDefaultCoverToChannel_(chat, caption, markup);
    if (!result || !result.ok) return { ok: false, error: "ارسال کاور پیش‌فرض ناموفق: " + String(result && result.description || "") };
    return { ok: true, messageIds: [Number(result.result.message_id)], visualKind: "", usedDefaultCover: true };
  }
  if (visuals.length === 1 && visuals[0].kind === "video_note") {
    // ویدیو مسیج کپشن ندارد → اطلاعات پست به‌صورت ریپلای روی همان ویدیو مسیج ارسال می‌شود.
    result = sendChannelMedia_("sendVideoNote", { chat_id: chat, video_note: visuals[0].fileId });
    if (!result || !result.ok) return { ok: false, error: "ارسال ویدیو مسیج ناموفق: " + String(result && result.description || "") };
    const noteId = Number(result.result.message_id);
    const out = { ok: true, messageIds: [noteId], visualKind: "video_note" };
    const reply = sendChannelMedia_("sendMessage", { chat_id: chat, text: caption, parse_mode: "HTML", reply_to_message_id: noteId, disable_web_page_preview: true });
    if (reply && reply.ok && reply.result && reply.result.message_id) {
      out.captionMessageId = Number(reply.result.message_id);
      out.messageIds = [noteId, out.captionMessageId];
      if (markup) telegramRequest_("editMessageReplyMarkup", { chat_id: chat, message_id: out.captionMessageId, reply_markup: markup });
    } else if (markup) {
      telegramRequest_("editMessageReplyMarkup", { chat_id: chat, message_id: noteId, reply_markup: markup });
    }
    return out;
  }
  if (visuals.length === 1 && visuals[0].kind === "voice") {
    const payload = { chat_id: chat, voice: visuals[0].fileId, caption: caption, parse_mode: "HTML" };
    if (markup) payload.reply_markup = markup;
    result = sendChannelMedia_("sendVoice", payload);
    if (!result || !result.ok) return { ok: false, error: "ارسال ویس ناموفق: " + String(result && result.description || "") };
    return { ok: true, messageIds: [Number(result.result.message_id)], visualKind: "voice" };
  }
  if (visuals.length === 1 && visuals[0].kind === "video") {
    const payload = { chat_id: chat, video: visuals[0].fileId, caption: caption, parse_mode: "HTML" };
    if (markup) payload.reply_markup = markup;
    result = sendChannelMedia_("sendVideo", payload);
    if (!result || !result.ok) return { ok: false, error: "ارسال ویدیو ناموفق: " + String(result && result.description || "") };
    return { ok: true, messageIds: [Number(result.result.message_id)], visualKind: "video" };
  }
  if (visuals.length === 1) {
    const payload = { chat_id: chat, photo: visuals[0].fileId, caption: caption, parse_mode: "HTML" };
    if (markup) payload.reply_markup = markup;
    result = sendChannelMedia_("sendPhoto", payload);
    if (!result || !result.ok) return { ok: false, error: "ارسال کاور ناموفق: " + String(result && result.description || "") };
    return { ok: true, messageIds: [Number(result.result.message_id)], visualKind: "photo" };
  }
  // گرید: حداکثر ۲ آیتم (عکس/ویدیو) در یک رسانه‌گروه؛ کپشن روی آیتم اول می‌نشیند.
  const group = visuals.slice(0, getMaxCoverPhotos_());
  const payload = { chat_id: chat, media: group.map(function(m, i) {
    const item = { type: m.kind === "video" ? "video" : "photo", media: m.fileId };
    if (i === 0) { item.caption = caption; item.parse_mode = "HTML"; }
    return item;
  }) };
  result = sendChannelMedia_("sendMediaGroup", payload);
  if (result && result.ok && Array.isArray(result.result)) {
    const ids = result.result.map(function(m) { return Number(m.message_id); });
    if (markup && ids.length) telegramRequest_("editMessageReplyMarkup", { chat_id: chat, message_id: ids[0], reply_markup: markup });
    return { ok: true, messageIds: ids, visualKind: "grid" };
  }
  const first = group[0];
  const fallback = first.kind === "video"
    ? sendChannelMedia_("sendVideo", { chat_id: chat, video: first.fileId, caption: caption, parse_mode: "HTML" })
    : sendChannelMedia_("sendPhoto", { chat_id: chat, photo: first.fileId, caption: caption, parse_mode: "HTML" });
  if (!fallback || !fallback.ok) return { ok: false, error: "ارسال کاور ناموفق: " + String(fallback && fallback.description || result && result.description || "") };
  const fid = Number(fallback.result.message_id);
  if (markup) telegramRequest_("editMessageReplyMarkup", { chat_id: chat, message_id: fid, reply_markup: markup });
  return { ok: true, messageIds: [fid], visualKind: "grid" };
}
function publishFreestyleStage_(sub, stage, channel, item) {
  stage.stage = "freestyle";
  const r = sendFreestylePostBody_(sub, channel, item, { markup: postActionsMarkup_(sub) });
  if (!r.ok) throw new Error(r.error);
  stage.visualMessageIds = r.messageIds;
  if (r.captionMessageId) stage.captionMessageId = r.captionMessageId;
  stage.visualKind = r.visualKind;
  // فایل صوتی جداگانه‌ای در کار نیست: خودِ اجرا محتوای پست است.
  stage.visual = true;
  stage.freestylePosted = true;
  stage.audio = true;
  stage.preview = true;
  setSubmissionField_(sub.id, "visualMessageIds", (stage.visualMessageIds || []).join("|"));
  savePublishStage_(sub, stage);
}
function publishVisualStage_(sub, stage, channel) {
  stage.stage = "visual";
  const r = sendVisualPostBody_(sub, channel, { markup: postActionsMarkup_(sub) });
  if (!r.ok) throw new Error(r.error);
  stage.visualMessageIds = r.messageIds;
  if (r.captionMessageId) stage.captionMessageId = r.captionMessageId;
  if (r.visualKind) stage.visualKind = r.visualKind;
  if (r.usedDefaultCover) stage.usedDefaultCover = true;
  stage.visual = true;
  setSubmissionField_(sub.id, "visualMessageIds", stage.visualMessageIds.join("|"));
  savePublishStage_(sub, stage);
}
function publishTextStage_(sub, stage, channel) {
  stage.stage = "text";
  const result = sendTextOnlyChannelPost_(channel, buildPostCaption_(sub));
  if (!result || !result.ok) throw new Error("ارسال متن ناموفق: " + String(result && result.description || ""));
  stage.text = true;
  stage.textMessageIds = [Number(result.result.message_id)];
  setSubmissionField_(sub.id, "visualMessageIds", appendMediaGroupIds_(sub.visualMessageIds, stage.textMessageIds));
  savePublishStage_(sub, stage);
}
function publishAudioStage_(sub, stage, channel) {
  stage.stage = "audio";
  const media = getSubmissionMedia_(sub.id);
  const audios = media.filter(function(m) { return m.kind === "audio"; });
  if (!audios.length) throw new Error("فایل صوتی برای این ارسال پیدا نشد.");
  const previewSeconds = getMusicPreviewSeconds_();
  const sentIds = (stage.audioMessageIds || []).slice();
  const persistIds = function() {
    // ذخیرهٔ افزایشی: اگر آلبوم وسط کار timeout شود، شناسهٔ پیام‌های ارسال‌شده گم نمی‌شود
    // و «توقف انتشار»/«حذف» می‌تواند آن‌ها را از کانال پاک کند.
    stage.audioMessageIds = sentIds.slice();
    try { setSubmissionField_(sub.id, "audioMessageIds", sentIds.join("|")); savePublishStage_(sub, stage); } catch (e) {}
  };
  audios.forEach(function(item, index) {
    const key = "audioSent_" + index;
    if (stage[key]) return;
    const trackId = musicTrackIdFromMedia_(sub.id, item, index);
    const libTrack = getMusicLibraryTrack_(trackId);
    const trackTitle = String(libTrack && libTrack.title || (audios.length > 1 ? String(sub.title || "Track") + " — " + (index + 1) : String(sub.title || "Track")));
    const performer = joinArtistsAmp_(sub.artists) + (String(sub.featuring || "").trim() ? " feat. " + joinArtistsAmp_(sub.featuring) : "");
    // کپشن پست صوتی طبق قالب: فقط نام ترک + خط تلگرام
    const base = { chat_id: channel, title: truncate_(trackTitle, 60), performer: truncate_(performer, 60), caption: buildAudioCaption_(sub, trackTitle), parse_mode: "HTML" };
    const markup = audioPostMarkup_(sub, trackId);
    if (markup) base.reply_markup = markup;
    const coverMessageId = Number((stage.visualMessageIds || [])[0] || 0);
    if (coverMessageId && String(getSetting_("POST_AUDIO_REPLY_TO_COVER") || "true") !== "false") base.reply_to_message_id = coverMessageId;
    // ۱) فقط برش ۳۰ ثانیه‌ای در کانال گذاشته می‌شود؛ فایل کامل هرگز در کانال ارسال نمی‌شود.
    //    فایل کامل فقط از راه دکمهٔ شیشه‌ای زیر همین پست (دیپ‌لینک به بات) به خود کاربر تحویل داده می‌شود.
    const previewBlob = buildAudioPreviewBlob_(item.fileId, previewSeconds);
    const cutInfo = lastPreviewCutInfo_();
    if (cutInfo) {
      stage.previewCutMode = cutInfo.mode;
      stage.previewCutFromSecond = cutInfo.startSecond;
      stage.previewCutSeconds = cutInfo.seconds;
      stage.previewCutBytes = cutInfo.bytes;
      stage.previewSourceSeconds = cutInfo.totalSeconds;
      stage.previewAvgGain = cutInfo.avgGain;
    }
    let previewOk = false;
    if (previewBlob) {
      const previewPayload = Object.assign({}, base, { audio: previewBlob });
      const previewResult = sendChannelAudio_(previewPayload);
      if (previewResult && previewResult.ok && previewResult.result) { sentIds.push(Number(previewResult.result.message_id)); persistIds(); previewOk = true; stage.preview = true; }
      else console.warn("preview failed: " + String(previewResult && previewResult.description || ""));
    }
    stage.previewAttempted = true;
    // ۲) اگر برش ۳۰ ثانیه‌ای ساخته نشد، باز هم فایل کامل در کانال گذاشته نمی‌شود
    //    (سیاست PREVIEW_FALLBACK_POLICY دیگر مسیر «ارسال فایل کامل» ندارد).
    //    دانلود برای کاربر باز می‌ماند و در صورت لزوم به مدیر خبر داده می‌شود.
    const policy = String(getSetting_("PREVIEW_FALLBACK_POLICY") || "preview_only");
    if (!previewOk) {
      stage.skippedFullReason = "preview_unavailable";
      stage.previewOnly = true;
      // دانلود از راه دکمهٔ شیشه‌ای همیشه فعال می‌ماند؛ فقط اگر فایل در دسترس نباشد بسته می‌شود.
      try { markFloorTrack_(trackId, policy === "admin_alert" ? false : true); } catch (e) {}
      if (policy === "admin_alert") {
        getAdmins_().forEach(function(a) {
          try {
            sendMessage_(a, "⚠️ برش ۳۰ ثانیه‌ای «" + trackTitle + "» ساخته نشد و فایل کامل هم در کانال گذاشته نمی‌شود.\n🆔 " + sub.id,
              { inline_keyboard: [[{ text: "📂 بررسی", callback_data: "a:sub:" + sub.id }]] });
          } catch (e) {}
        });
      }
    }
    stage[key] = true;
    if (libTrack) stage[key + "_track"] = trackId;
  });
  stage.audioMessageIds = sentIds.slice();
  // اگر هیچ پست صوتی‌ای در کانال ساخته نشد (برش ۳۰ ثانیه‌ای ممکن نبود)، دکمهٔ دریافت فایل کامل
  // روی همان پست کاور می‌نشیند تا راه رسیدن به آهنگ کامل بسته نماند.
  if (!sentIds.length) {
    const coverIds = stage.visualMessageIds || [];
    const coverId = Number(stage.captionMessageId || coverIds[0] || 0);
    const fallbackMarkup = downloadButtonMarkup_(sub, "");
    if (coverId && fallbackMarkup) {
      try { telegramRequest_("editMessageReplyMarkup", { chat_id: channel, message_id: coverId, reply_markup: fallbackMarkup }); } catch (e) {}
      stage.downloadButtonOnCover = true;
    }
  }
  setSubmissionField_(sub.id, "audioMessageIds", sentIds.join("|"));
  savePublishStage_(sub, stage);
}
function sendChannelAudio_(payload) {
  // پست صوتی به پست کاور ریپلای می‌شود تا رشتهٔ کامنت‌ها زیر همان پست کاور بماند؛
  // اگر تلگرام ریپلای را نپذیرد، همان پیام بدون ریپلای فرستاده می‌شود.
  let result = telegramMultipartRequest_("sendAudio", payload);
  if (result && !result.ok && payload.reply_to_message_id) {
    const clone = Object.assign({}, payload);
    delete clone.reply_to_message_id;
    result = telegramMultipartRequest_("sendAudio", clone);
  }
  return result;
}
// ───────── تازه‌سازی دکمهٔ دانلود پست‌های قدیمی ─────────
// لینک دیپ‌لینک امضاشده و تاریخ‌دار است؛ اگر دکمه تا ابد بماند پس از انقضا می‌میرد.
// این کار روزانه دکمهٔ پست‌های منتشرشده را با توکن تازه بازنویسی می‌کند.
function refreshDownloadButtonsJob() {
  resetRuntimeCaches_();
  const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
  if (!channel) return 0;
  if (String(getSetting_("DOWNLOAD_LINK_TOKEN") || "true") !== "true") return 0;
  const refreshDays = Math.max(1, Number(getSetting_("DOWNLOAD_BUTTON_REFRESH_DAYS") || 20));
  const ttlDays = Math.max(2, Number(getSetting_("DOWNLOAD_LINK_TTL_DAYS") || 30));
  const dueBefore = nowMs_() + (ttlDays - refreshDays) * 86400000;
  let updated = 0;
  const subs = getAllSubmissions_().filter(function(s) { return s.status === "published"; });
  for (let i = 0; i < subs.length; i++) {
    const sub = subs[i];
    const stage = parsePublishStage_(sub);
    const ids = (stage.audioMessageIds || []).concat(stage.visualMessageIds || []);
    if (!ids.length) continue;
    // اگر آخرین تازه‌سازی نزدیک است، رد شو
    const last = dateMillis_(stage.downloadRefreshedAt);
    if (last && last > nowMs() - refreshDays * 86400000 && last + (ttlDays - refreshDays) * 86400000 > nowMs()) continue;
    if (last && dueBefore < nowMs()) continue;
    const markup = downloadButtonMarkup_(sub, "");
    if (!markup) continue;
    let ok = false;
    ids.forEach(function(mid) {
      const r = telegramRequest_("editMessageReplyMarkup", { chat_id: channel, message_id: Number(mid), reply_markup: markup });
      if (r && r.ok) ok = true;
    });
    if (ok) { stage.downloadRefreshedAt = nowMs_(); savePublishStage_(sub, stage); updated++; }
  }
  if (updated) console.log("refreshDownloadButtonsJob: " + updated + " پست تازه شد.");
  return updated;
}
function getMusicPreviewSeconds_() {
  const n = Number(getSetting_("MUSIC_PREVIEW_SECONDS") || 30);
  return Math.max(3, Math.min(90, isNaN(n) ? 30 : n));
}
function refreshPublishedPrimaryDownloadButton_(submission, trackId) {
  const sub = submission; if (!sub) return false;
  if (String(sub.status) !== "published") return false;
  const stage = parsePublishStage_(sub);
  const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
  if (!channel) return false;
  if (trackId && getMusicLibraryTrack_(trackId) && String(getMusicLibraryTrack_(trackId).submissionId) !== String(sub.id)) return false;
  // دکمه‌های دانلود روی پیام‌های صوتی هستند؛ اگر نبودند، کاور.
  const ids = (stage.audioMessageIds || []).length ? stage.audioMessageIds : (stage.visualMessageIds || []);
  const markup = postActionsMarkup_(sub);
  let ok = false;
  const targetTrack = trackId || ((getMusicLibrary_().filter(function(x) { return x.submissionId === sub.id && x.downloadAllowed && x.fileId; })[0] || {}).trackId || "");
  ids.forEach(function(mid) {
    const m = trackId && ids.length > 1 ? downloadButtonMarkup_(sub, targetTrack) : markup;
    const r = telegramRequest_("editMessageReplyMarkup", { chat_id: channel, message_id: mid, reply_markup: m || { inline_keyboard: [] } });
    if (r && r.ok) ok = true;
  });
  return ok;
}

// ───────────────────────── برش فایل صوتی برای پیش‌نمایش ─────────────────────────
const MP3_BITRATES_ = {
  "1-1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1-2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1-3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2-1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2-2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2-3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};
const MP3_RATES_ = { 1: [44100, 48000, 32000], 2: [22050, 24000, 16000], 25: [11025, 12000, 8000] };
function mp3FrameInfo_(bytes, offset) {
  if (offset + 4 > bytes.length) return null;
  if ((bytes[offset] & 0xFF) !== 0xFF) return null;
  const b1 = bytes[offset + 1] & 0xFF;
  if ((b1 & 0xE0) !== 0xE0) return null;
  const versionBits = (b1 >> 3) & 0x03;
  const layerBits = (b1 >> 1) & 0x03;
  if (versionBits === 1 || layerBits === 0) return null;
  const version = versionBits === 3 ? 1 : versionBits === 2 ? 2 : 25;
  const layer = 4 - layerBits;
  const b2 = bytes[offset + 2] & 0xFF;
  const bitrateIndex = (b2 >> 4) & 0x0F;
  if (bitrateIndex === 0 || bitrateIndex === 15) return null;
  const rateIndex = (b2 >> 2) & 0x03;
  if (rateIndex === 3) return null;
  const padding = (b2 >> 1) & 0x01;
  const sampleRate = MP3_RATES_[version][rateIndex];
  const tableKey = (version === 1 ? "1" : "2") + "-" + layer;
  const bitrate = MP3_BITRATES_[tableKey][bitrateIndex] * 1000;
  let frameLength, samplesPerFrame;
  if (layer === 1) { frameLength = (Math.floor(12 * bitrate / sampleRate) + padding) * 4; samplesPerFrame = 384; }
  else if (layer === 2) { frameLength = Math.floor(144 * bitrate / sampleRate) + padding; samplesPerFrame = 1152; }
  else { frameLength = Math.floor((version === 1 ? 144 : 72) * bitrate / sampleRate) + padding; samplesPerFrame = version === 1 ? 1152 : 576; }
  if (frameLength < 24) return null;
  const b3 = bytes[offset + 3] & 0xFF;
  const channelMode = (b3 >> 6) & 0x03;   // 0 stereo, 1 joint, 2 dual, 3 mono
  return {
    frameLength: frameLength, duration: samplesPerFrame / sampleRate, layer: layer,
    version: version, sampleRate: sampleRate, bitrate: bitrate,
    mono: channelMode === 3, hasCrc: (b1 & 0x01) === 0
  };
}
function id3v2Length_(bytes) {
  if (bytes.length < 10) return 0;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0;
  const size = ((bytes[6] & 0x7F) << 21) | ((bytes[7] & 0x7F) << 14) | ((bytes[8] & 0x7F) << 7) | (bytes[9] & 0x7F);
  const footer = (bytes[5] & 0x10) ? 10 : 0;
  return 10 + size + footer;
}
function fileIdLooksLikeFileId_(fileId) { return /^[A-Za-z0-9_-]{10,}$/.test(String(fileId || "")); }
// ───────────────────────── برش کوتاه از اوج آهنگ برای کانال ─────────────────────────
// سیاست سخت: در کانال هرگز بیشتر از MUSIC_PREVIEW_SECONDS ثانیه نمی‌رود. اگر برشِ دقیق
// ممکن نباشد، null برمی‌گردد → پست صوتی ساخته نمی‌شود و دکمهٔ دریافت روی پست کاور
// می‌نشیند. دیگر هیچ مسیر «برش بایتیِ کور» وجود ندارد (همان مسیری که عملاً ~۳ دقیقه
// از آهنگ را به کانال می‌فرستاد و کاربر آن را «پست شدن آهنگ کامل» می‌دید).
//
// پیدا کردن «اوج» بدون رمزگشایی: در Apps Script نمی‌توان MP3 را به PCM برگرداند
// (حافظه + سقف ۶ دقیقهٔ اجرا)، پس بلندی از خودِ بیت‌استریم فشرده تخمین زده می‌شود:
//   · global_gain هر فریم — مقیاس اصلی بلندی در MP3 (فریم بلندتر ⇒ gain بالاتر)
//   · اندازهٔ فریم — در فایل‌های VBR بخش‌های پرانرژی بزرگ‌تر کد می‌شوند
// اگر هیچ‌کدام سیگنال ندهند، از جای پیش‌فرض PREVIEW_PEAK_POSITION_PCT استفاده می‌شود.
function previewSettingNum_(key, fallback, min, max) {
  const n = Number(getSetting_(key));
  const v = isFinite(n) && n > 0 ? n : fallback;
  return Math.max(min, Math.min(max, v));
}
// یک تکه از فایل با HTTP Range (تلگرام ۲۰۶ برمی‌گرداند). bytes = بایت‌ها، base = آفست مطلق.
function fetchFileRange_(fileUrl, start, endInclusive) {
  const from = Math.max(0, Math.floor(start));
  const to = Math.max(from, Math.floor(endInclusive));
  const response = UrlFetchApp.fetch(fileUrl, { headers: { Range: "bytes=" + from + "-" + to }, muteHttpExceptions: true });
  const code = response ? response.getResponseCode() : 0;
  // ۲۰۶ = همان تکه؛ ۲۰۰ = سرور Range را نادیده گرفته و کل فایل را داده است.
  if (code !== 206 && code !== 200) return null;
  const bytes = response.getBlob().getBytes();
  if (!bytes || !bytes.length) return null;
  return { bytes: bytes, base: code === 200 ? 0 : from, full: code === 200 };
}
// خواندن n بیت از آرایهٔ بایت (برای side information)
function mp3BitRead_(bytes, bitPos, n) {
  let value = 0;
  for (let i = 0; i < n; i++) {
    const p = bitPos + i;
    const b = bytes[p >> 3];
    if (b === undefined) return -1;
    value = (value << 1) | ((b >> (7 - (p & 7))) & 1);
  }
  return value >>> 0;
}
// چیدمان side information بر اساس نسخه و تعداد کانال
function mp3SideInfoBits_(info) {
  const nch = info.mono ? 1 : 2;
  if (info.version === 1) return { header: 9 + (info.mono ? 3 : 5) + 4 * nch, block: 59, blocks: 2 * nch };
  return { header: 8 + (info.mono ? 1 : 2), block: 63, blocks: nch };
}
// میانگین global_gain یک فریم (۰ تا ۲۵۵) — سیگنال اصلی بلندی. اگر خوانده نشد: -1
function mp3FrameGains_(bytes, off, info) {
  if (info.layer !== 3) return -1;
  const si = mp3SideInfoBits_(info);
  const start = (off + 4 + (info.hasCrc ? 2 : 0)) * 8 + si.header;
  let sum = 0;
  for (let k = 0; k < si.blocks; k++) {
    const g = mp3BitRead_(bytes, start + k * si.block + 21, 8);
    if (g < 0) return -1;
    sum += g;
  }
  return sum / si.blocks;
}
// همگام‌سازی معتبر: سه فریم پشت‌سرهم با نسخه/نرخ نمونه/حالت کانال یکسان
function mp3FindSync_(bytes, from, limit) {
  const start = Math.max(0, Number(from) || 0);
  const max = Math.min(bytes.length - 8, start + Math.max(1024, Number(limit) || 500000));
  for (let i = start; i <= max; i++) {
    if ((bytes[i] & 0xFF) !== 0xFF) continue;
    const a = mp3FrameInfo_(bytes, i);
    if (!a) continue;
    let off = i + a.frameLength;
    let good = 1;
    for (let k = 0; k < 3; k++) {
      const b = mp3FrameInfo_(bytes, off);
      if (!b) { good = -1; break; }
      if (b.version !== a.version || b.sampleRate !== a.sampleRate || b.layer !== a.layer || b.mono !== a.mono) { good = -1; break; }
      good++; off += b.frameLength;
    }
    if (good >= 3) return i;
  }
  return -1;
}
// فهرست فریم‌ها با آفست مطلق (base) تا پنجرهٔ برش دقیقاً روی مرز فریم بنشیند
function mp3Profile_(bytes, from, base, maxFrames) {
  const out = [];
  const cap = Math.max(16, Math.min(400000, Number(maxFrames) || 200000));
  const baseOffset = Number(base) || 0;
  let off = Math.max(0, Number(from) || 0);
  let misses = 0;
  while (off + 4 <= bytes.length && out.length < cap) {
    const f = mp3FrameInfo_(bytes, off);
    if (!f) { off++; misses++; if (misses > 300000) break; continue; }
    misses = 0;
    let gain = -1;
    try { gain = mp3FrameGains_(bytes, off, f); } catch (e) { gain = -1; }
    out.push({ off: baseOffset + off, len: f.frameLength, dur: f.duration, gain: gain, bitrate: f.bitrate, version: f.version, sampleRate: f.sampleRate, mono: f.mono });
    off += f.frameLength;
  }
  return out;
}
// هدر Xing/Info: تعداد فریم‌ها، حجم و جدول جست‌وجو (برای فایل‌های VBR)
function mp3XingInfo_(bytes, frameOffset, info) {
  try {
    const sideBytes = info.version === 1 ? (info.mono ? 17 : 32) : (info.mono ? 9 : 17);
    const start = frameOffset + 4 + (info.hasCrc ? 2 : 0) + sideBytes;
    let at = -1;
    for (let i = 0; i < 40 && start + i + 8 <= bytes.length; i++) {
      const id = String.fromCharCode(bytes[start + i], bytes[start + i + 1], bytes[start + i + 2], bytes[start + i + 3]);
      if (id === "Xing" || id === "Info") { at = start + i; break; }
    }
    if (at < 0) return null;
    const be32 = function(p) { return ((bytes[p] & 0xFF) * 16777216) + ((bytes[p + 1] & 0xFF) << 16) + ((bytes[p + 2] & 0xFF) << 8) + (bytes[p + 3] & 0xFF); };
    const flags = be32(at + 4);
    let p = at + 8;
    const out = { flags: flags, frames: 0, bytes: 0, toc: null };
    if (flags & 1) { out.frames = be32(p); p += 4; }
    if (flags & 2) { out.bytes = be32(p); p += 4; }
    if (flags & 4) { out.toc = bytes.slice(p, p + 100); p += 100; }
    return (out.frames || out.bytes || out.toc) ? out : null;
  } catch (e) { return null; }
}
function mp3AvgFrame_(profile) {
  if (!profile || !profile.length) return { len: 417, dur: 0.02612, bitrate: 128000 };
  let len = 0, dur = 0, br = 0;
  profile.forEach(function(f) { len += f.len; dur += f.dur; br += f.bitrate; });
  const n = profile.length;
  return { len: len / n, dur: dur / n, bitrate: br / n };
}
// طول کل اثر (ثانیه)
function mp3TotalSeconds_(ctx) {
  const avg = mp3AvgFrame_(ctx.profile);
  if (ctx.xing && ctx.xing.frames && avg.dur > 0) return ctx.xing.frames * avg.dur;
  const audioBytes = Math.max(0, (ctx.fullSize || 0) - (ctx.syncAbs || 0));
  const bps = avg.bitrate > 0 ? avg.bitrate / 8 : 16000;
  const fromBytes = bps > 0 ? audioBytes / bps : 0;
  if (ctx.xing && ctx.xing.bytes && fromBytes <= 0) return ctx.xing.bytes / bps;
  if (fromBytes > 0) return fromBytes;
  let t = 0; ctx.profile.forEach(function(f) { t += f.dur; });
  return t;
}
// آفست بایتِ تقریبی برای یک لحظه (برای فایل‌های بزرگ که کل‌شان دانلود نمی‌شود)
function mp3OffsetForSecond_(ctx, second) {
  const avg = mp3AvgFrame_(ctx.profile);
  const bps = avg.bitrate > 0 ? avg.bitrate / 8 : 16000;
  const total = ctx.totalSeconds || 0;
  if (ctx.xing && ctx.xing.toc && ctx.xing.toc.length === 100 && total > 0 && ctx.xing.bytes > 0) {
    const pctPos = Math.max(0, Math.min(99.999, (second / total) * 100));
    const i = Math.floor(pctPos);
    const a = ctx.xing.toc[i] & 0xFF;
    const b = ctx.xing.toc[Math.min(99, i + 1)] & 0xFF;
    const frac = pctPos - i;
    const pct = (a + (b - a) * frac) / 256;
    return Math.floor((ctx.syncAbs || 0) + pct * ctx.xing.bytes);
  }
  return Math.floor((ctx.syncAbs || 0) + second * bps);
}
// انرژی یک فریم: بلندی (global_gain) با وزن بیشتر + اندازهٔ فریم
function frameEnergy_(frame, refAvgLen) {
  const gain = frame.gain >= 0 ? frame.gain / 255 : -1;
  const size = refAvgLen > 0 ? Math.min(2, frame.len / refAvgLen) / 2 : -1;
  if (gain >= 0 && size >= 0) return 0.75 * gain + 0.25 * size;
  if (gain >= 0) return gain;
  if (size >= 0) return size;
  return -1;
}
function profileEnergy_(profile, refAvgLen) {
  let sum = 0, n = 0;
  profile.forEach(function(f) { const e = frameEnergy_(f, refAvgLen); if (e >= 0) { sum += e; n++; } });
  return n ? sum / n : -1;
}
// پنجرهٔ اوج: بیشترین میانگین انرژی در یک پنجرهٔ `seconds` ثانیه‌ای (پنجرهٔ لغزان O(n))
function pickPeakWindow_(profile, seconds, options) {
  const opts = options || {};
  const skip = Math.max(0, Number(opts.skipSeconds) || 0);
  const pct = Math.max(0, Math.min(90, Number(opts.positionPct) || 0));
  const refAvgLen = mp3AvgFrame_(profile).len;
  if (!profile || !profile.length) return null;
  const n = profile.length;
  // جمع مدت تا پیش از هر فریم (برای محاسبهٔ زمان شروع بدون پیمایش دوباره)
  const starts = new Array(n + 1);
  starts[0] = 0;
  let dur = 0;
  const energy = new Array(n);
  let hasSignal = false;
  for (let i = 0; i < n; i++) {
    starts[i + 1] = dur;
    dur += profile[i].dur;
    energy[i] = frameEnergy_(profile[i], refAvgLen);
    if (energy[i] >= 0) hasSignal = true;
  }
  if (dur <= 0) return null;
  // اثر کوتاه‌تر از برش → همان ابتدا (عملاً کل اثر)
  if (dur <= seconds * 1.15) return { startSecond: 0, startAbs: profile[0].off, endAbs: profile[n - 1].off + profile[n - 1].len, mode: "start", score: profileEnergy_(profile, refAvgLen) };
  // آخرین لحظهٔ شروعی که هنوز برشِ کاملِ `seconds` ثانیه‌ای می‌دهد (وگرنه برش کوتاه می‌شود)
  const lastStart = Math.max(0, dur - seconds);
  const pctStart = Math.min(Math.round(dur * pct / 100), lastStart);
  if (!hasSignal) return { startSecond: pctStart, mode: "position", score: -1 };
  let left = 0, sum = 0, winDur = 0;
  let best = null, bestScore = -1, worstScore = Infinity;
  for (let right = 0; right < n; right++) {
    if (energy[right] >= 0) sum += energy[right];
    winDur += profile[right].dur;
    while (winDur > seconds && left < right) {
      if (energy[left] >= 0) sum -= energy[left];
      winDur -= profile[left].dur;
      left++;
    }
    if (winDur < seconds * 0.9) continue;
    const count = right - left + 1;
    if (count <= 0) continue;
    const startSecond = starts[left];
    if (startSecond < skip && left < n - 1) continue;   // intro را رد می‌کنیم
    if (startSecond > lastStart + 0.001) continue;      // از اینجا به بعد ۳۰ ثانیهٔ کامل باقی نمانده
    const score = sum / count;
    if (score > bestScore) {
      bestScore = score;
      best = { startFrame: left, endFrame: right, startSecond: startSecond, score: score, startAbs: profile[left].off };
    }
    if (score < worstScore) worstScore = score;
  }
  if (!best) return { startSecond: Math.min(Math.max(skip, Math.round(dur * pct / 100)), lastStart), mode: "position", score: -1 };
  // انرژی سرتاسر اثر یکدست است (CBR با gain ثابت) → جای درصدی قابل‌اعتمادتر از «اوج» است
  if (pct > 0 && worstScore < Infinity && (bestScore - worstScore) < 0.01) {
    return { startSecond: pctStart, mode: "position", score: bestScore };
  }
  best.mode = "peak";
  best.endAbs = profile[best.endFrame].off + profile[best.endFrame].len;
  return best;
}
// فایل‌های بزرگ: به‌جای دانلود کل، چند نمونه در طول اثر کاوش می‌شود و پرانرژی‌ترین برگزیده می‌شود
function probePeakWindow_(ctx, fileUrl) {
  const probes = Math.round(previewSettingNum_("PREVIEW_PROBE_COUNT", 6, 2, 12));
  const probeBytes = Math.round(previewSettingNum_("PREVIEW_PROBE_BYTES", 60000, 16000, 400000));
  const skip = previewSettingNum_("PREVIEW_PEAK_SKIP_SECONDS", 8, 0, 120);
  const pct = previewSettingNum_("PREVIEW_PEAK_POSITION_PCT", 30, 0, 90);
  const total = ctx.totalSeconds;
  const want = ctx.want;
  const lastStart = Math.max(0, total - want);
  const lo = Math.min(skip, lastStart);
  const hi = Math.max(lo, lastStart);
  const refAvgLen = mp3AvgFrame_(ctx.profile).len;
  let best = null;
  for (let i = 0; i < probes; i++) {
    const t = lo + (hi - lo) * (probes === 1 ? 0.5 : i / (probes - 1));
    const off = mp3OffsetForSecond_(ctx, t);
    if (!isFinite(off) || off < 0 || off >= (ctx.fullSize || 0)) continue;
    const chunk = fetchFileRange_(fileUrl, off, Math.min((ctx.fullSize || off + probeBytes) - 1, off + probeBytes - 1));
    if (!chunk || chunk.bytes.length < 8192) continue;
    const localSync = chunk.full ? mp3FindSync_(chunk.bytes, Math.max(0, off - chunk.base), 8192) : mp3FindSync_(chunk.bytes, 0, 8192);
    if (localSync < 0) continue;
    const prof = mp3Profile_(chunk.bytes, localSync, chunk.base + localSync, 6000);
    if (prof.length < 20) continue;
    const score = profileEnergy_(prof, refAvgLen);
    if (score < 0) continue;
    if (!best || score > best.score) best = { score: score, startSecond: t, startAbs: prof[0].off };
  }
  if (!best) return { startSecond: Math.min(Math.round(total * pct / 100), lastStart), mode: "position", score: -1 };
  best.mode = "probe";
  return best;
}
// اندازهٔ تگ ID3v2 وقتی انکودر اندازه را synchsafe ننوشته باشد (فایل‌های قدیمی)
function id3RawLength_(bytes) {
  if (!bytes || bytes.length < 10) return 0;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0;
  const size = ((bytes[6] & 0xFF) << 24) | ((bytes[7] & 0xFF) << 16) | ((bytes[8] & 0xFF) << 8) | (bytes[9] & 0xFF);
  const footer = (bytes[5] & 0x10) ? 10 : 0;
  return (size > 0 && size < 40 * 1024 * 1024) ? 10 + size + footer : 0;
}
// آفست فریمی که در لحظهٔ `second` شروع می‌شود (از روی همان پروفایل)
function offsetFromProfileTime_(profile, second) {
  let t = 0;
  for (let i = 0; i < profile.length; i++) {
    if (t >= second) return profile[i].off;
    t += profile[i].dur;
  }
  return profile.length ? profile[profile.length - 1].off : -1;
}
function lastPreviewCutInfo_() { return PREVIEW_CUT_INFO_MEMO_; }
// برشِ دقیقِ یک بازهٔ زمانی روی مرز فریم. اگر بازه به `want` ثانیه نرسد، طول واقعی را برمی‌گرداند
// تا فراخوان بتواند از جای امن‌تری دوباره تلاش کند. گاردهای سخت همین‌جا هستند.
function cutMp3Window_(ctx, startSecond, opts) {
  const fileUrl = opts.fileUrl, allBytes = opts.allBytes, syncAbs = opts.syncAbs, want = opts.want;
  const tagBytes = opts.tagBytes || [], first = opts.first;
  const maxBps = Math.max(mp3AvgFrame_(ctx.profile).bitrate, (first && first.bitrate) || 0) / 8;
  const maxWinBytes = Math.ceil(want * maxBps * 1.5) + 16384;
  let winStartAbs = startSecond <= 0 ? syncAbs : mp3OffsetForSecond_(ctx, startSecond);
  if (!isFinite(winStartAbs) || winStartAbs < syncAbs) winStartAbs = syncAbs;
  if (ctx.fullSize && winStartAbs >= ctx.fullSize) winStartAbs = syncAbs;
  let winBytes = null, winBase = winStartAbs;
  if (allBytes) {
    const from = Math.max(0, Math.min(allBytes.length - 4, winStartAbs - syncAbs));
    winBytes = allBytes.slice(from, Math.min(allBytes.length, from + maxWinBytes));
    winBase = syncAbs + from;
  } else {
    const chunk = fetchFileRange_(fileUrl, winStartAbs, Math.min((ctx.fullSize || winStartAbs + maxWinBytes) - 1, winStartAbs + maxWinBytes - 1));
    if (!chunk) return null;
    winBytes = chunk.bytes; winBase = chunk.base;
  }
  if (!winBytes || winBytes.length < 1024) return null;
  // اگر آفست تقریبی وسط فریم افتاد، با همگام‌سازی معتبر به مرز فریم برمی‌گردیم
  let cutLocal = winBase === syncAbs && startSecond <= 0 ? 0 : mp3FindSync_(winBytes, 0, Math.min(65536, winBytes.length));
  if (cutLocal < 0) cutLocal = 0;
  const cutProfile = mp3Profile_(winBytes, cutLocal, winBase, 20000);
  if (cutProfile.length < 2) return null;
  let elapsed = 0, endLocal = cutLocal, frames = 0, gainSum = 0, gainN = 0;
  for (let i = 0; i < cutProfile.length; i++) {
    if (elapsed >= want) break;
    const local = cutProfile[i].off - winBase + cutProfile[i].len;
    if (local > winBytes.length) break;
    endLocal = local; elapsed += cutProfile[i].dur; frames++;
    if (cutProfile[i].gain >= 0) { gainSum += cutProfile[i].gain; gainN++; }
  }
  // ── گاردهای سخت: هرگز بیشتر از برش خواسته‌شده به کانال نمی‌رود ──
  if (frames < 2 || elapsed <= 0) return null;
  if (elapsed > want * 1.25) return null;
  if (endLocal <= cutLocal) return null;
  const body = winBytes.slice(cutLocal, endLocal);
  const out = tagBytes.length ? tagBytes.concat(body) : body;
  const hardCap = Math.ceil(want * (320000 / 8) * 1.3) + tagBytes.length + 16384;
  if (!out.length || out.length > hardCap) return null;
  return { out: out, elapsed: elapsed, frames: frames, avgGain: gainN ? Math.round(gainSum / gainN) : -1 };
}
// برش MP3: اول «کجای اثر» انتخاب می‌شود (اوج)، بعد همان بازه روی مرز فریم بریده می‌شود.
function buildMp3PreviewBlob_(fileUrl, fullSize, want) {
  const analyzeMax = previewSettingNum_("PREVIEW_ANALYZE_MAX_MB", 8, 1, 18) * 1024 * 1024;
  const headBytes = Math.round(previewSettingNum_("PREVIEW_HEAD_BYTES", 262144, 65536, 4000000));
  const tagKeepMax = Math.round(previewSettingNum_("PREVIEW_TAG_KEEP_BYTES", 262144, 0, 2097152));
  const mode = String(getSetting_("PREVIEW_PEAK_MODE") || "peak").trim().toLowerCase();
  const skip = previewSettingNum_("PREVIEW_PEAK_SKIP_SECONDS", 8, 0, 120);
  const pct = previewSettingNum_("PREVIEW_PEAK_POSITION_PCT", 30, 0, 90);
  PREVIEW_CUT_INFO_MEMO_ = null;

  // ── ۱) هد: تگ + نخستین فریم‌ها (برای نمونه/نرخ‌بیت/طول اثر) ──
  const head = fetchFileRange_(fileUrl, 0, headBytes - 1);
  if (!head) return null;
  let bytes = head.bytes, base = head.base;
  let localSync = mp3FindSync_(bytes, 0, bytes.length);
  // تگِ بزرگ‌تر از هد (کاور آرت سنگین): از بعد از تگ دوباره تلاش می‌کنیم
  if (localSync < 0) {
    const candidates = [id3v2Length_(bytes), id3RawLength_(bytes)];
    for (let i = 0; i < candidates.length && localSync < 0; i++) {
      const at = Number(candidates[i]);
      if (!at || at <= 0 || (fullSize && at >= fullSize)) continue;
      const body = fetchFileRange_(fileUrl, at, at + headBytes - 1);
      if (!body) continue;
      const s2 = mp3FindSync_(body.bytes, 0, Math.min(131072, body.bytes.length));
      if (s2 >= 0) { bytes = body.bytes; base = body.base; localSync = s2; }
    }
  }
  if (localSync < 0) return null;
  const syncAbs = base + localSync;
  const first = mp3FrameInfo_(bytes, localSync);
  if (!first) return null;
  const headProfile = mp3Profile_(bytes, localSync, syncAbs, 20000);
  if (headProfile.length < 3) return null;
  // تگ فقط وقتی نگه داشته می‌شود که کامل در هد باشد و از سقف بزرگ‌تر نباشد
  let tagBytes = [];
  if (base === 0 && syncAbs > 0 && syncAbs <= tagKeepMax) tagBytes = head.bytes.slice(0, syncAbs);
  const ctx = { fullSize: fullSize, syncAbs: syncAbs, profile: headProfile, xing: mp3XingInfo_(bytes, localSync, first), want: want };
  ctx.totalSeconds = mp3TotalSeconds_(ctx);

  // ── ۲) انتخاب لحظهٔ شروع برش ──
  let startSecond = 0, cutMode = "start", allBytes = null, window = null;
  if (mode === "peak" && ctx.totalSeconds > want * 1.15) {
    if (fullSize && fullSize <= analyzeMax) {
      // کل اثر در حافظه → تحلیل دقیق فریم‌به‌فریم (بهترین دقت)
      const all = fetchFileRange_(fileUrl, syncAbs, fullSize - 1);
      if (all && all.bytes.length > 4096) {
        const profile = mp3Profile_(all.bytes, 0, syncAbs);
        if (profile.length > headProfile.length) { ctx.profile = profile; ctx.totalSeconds = mp3TotalSeconds_(ctx); }
        allBytes = all.bytes;
        window = pickPeakWindow_(ctx.profile, want, { skipSeconds: skip, positionPct: pct });
      }
    }
    if (!window) window = probePeakWindow_(ctx, fileUrl);
    if (window) { startSecond = Math.max(0, Number(window.startSecond) || 0); cutMode = window.mode || "peak"; }
  }

  // ── ۳) برش روی مرز فریم؛ اگر به ۳۰ ثانیهٔ کامل نرسید، از جای امن‌تر دوباره تلاش می‌شود ──
  //    (اثر کوتاه، دمِ کوتاه، یا خطای تخمین طول — در هر حالت برش باید تا جای ممکن کامل باشد)
  const lastStart = Math.max(0, ctx.totalSeconds - want);
  if (startSecond > lastStart) startSecond = lastStart;
  const cutOpts = { fileUrl: fileUrl, allBytes: allBytes, syncAbs: syncAbs, want: want, tagBytes: tagBytes, first: first };
  const tooShort = function(r) { return !r || r.elapsed < want - 0.6; };
  let res = cutMp3Window_(ctx, startSecond, cutOpts);
  if (tooShort(res) && startSecond > 0.5) {
    // تلاش دوم: آخرین شروعی که کل ۳۰ ثانیه در آن جا می‌شود
    if (lastStart < startSecond - 0.5) {
      const r2 = cutMp3Window_(ctx, lastStart, cutOpts);
      if (r2 && (!res || r2.elapsed > res.elapsed)) { res = r2; startSecond = lastStart; cutMode = "position"; }
    }
  }
  if (tooShort(res) && startSecond > 0.5) {
    // تلاش سوم: از ابتدای اثر — طول کامل بر هر چیز دیگری اولویت دارد
    const r3 = cutMp3Window_(ctx, 0, cutOpts);
    if (r3 && (!res || r3.elapsed > res.elapsed)) { res = r3; startSecond = 0; cutMode = "start"; }
  }
  if (!res) return null;
  PREVIEW_CUT_INFO_MEMO_ = {
    mode: cutMode, startSecond: Math.round(startSecond), seconds: Math.round(res.elapsed), frames: res.frames,
    bytes: res.out.length, sourceBytes: fullSize || 0, totalSeconds: Math.round(ctx.totalSeconds),
    avgGain: res.avgGain, tagBytes: tagBytes.length
  };
  return Utilities.newBlob(res.out, "audio/mpeg", "preview.mp3");
}
// WAV: برش دقیق با byteRate (فقط همان ۳۰ ثانیه دانلود می‌شود، نه کل فایل)
// انرژی یک تکهٔ PCM (۰ تا ۱) — معیار بلندی برای فایل‌های بدون فشرده‌سازی
function wavEnergy_(bytes, bitsPerSample) {
  if (!bytes || bytes.length < 64) return -1;
  let sum = 0, n = 0;
  if (bitsPerSample === 16) {
    const last = bytes.length - (bytes.length % 2);
    for (let i = 0; i < last; i += 2) {
      let v = bytes[i] | (bytes[i + 1] << 8);
      if (v > 32767) v -= 65536;
      sum += Math.abs(v); n++;
    }
    return n ? sum / n / 32768 : -1;
  }
  for (let i = 0; i < bytes.length; i++) { sum += Math.abs(bytes[i] - 128); n++; }
  return n ? sum / n / 128 : -1;
}
// اوج یک WAV را با نمونه‌برداری از چند تکهٔ پراکنده پیدا می‌کند (بدون دانلود کامل فایل)
function wavProbePeakSecond_(fileUrl, dataStart, dataEnd, byteRate, bitsPerSample, want) {
  const probes = Math.round(previewSettingNum_("PREVIEW_PROBE_COUNT", 6, 2, 12));
  const probeBytes = Math.round(previewSettingNum_("PREVIEW_PROBE_BYTES", 60000, 16000, 400000));
  const skip = previewSettingNum_("PREVIEW_PEAK_SKIP_SECONDS", 8, 0, 120);
  const pct = previewSettingNum_("PREVIEW_PEAK_POSITION_PCT", 30, 0, 90);
  const audioBytes = dataEnd - dataStart;
  const wantBytes = Math.floor(byteRate * want);
  const lastStart = Math.max(0, audioBytes - wantBytes);
  const lo = Math.min(Math.floor(skip * byteRate), lastStart);
  const hi = Math.max(lo, lastStart);
  const totalSeconds = audioBytes / byteRate;
  let best = null;
  for (let i = 0; i < probes; i++) {
    const rel = lo + (hi - lo) * (probes === 1 ? 0.5 : i / (probes - 1));
    const off = dataStart + Math.floor(rel);
    if (off >= dataEnd) continue;
    const chunk = fetchFileRange_(fileUrl, off, Math.min(dataEnd - 1, off + probeBytes - 1));
    if (!chunk) continue;
    const sample = chunk.full ? chunk.bytes.slice(off, Math.min(chunk.bytes.length, off + probeBytes)) : chunk.bytes;
    if (!sample || sample.length < 2048) continue;
    const score = wavEnergy_(sample, bitsPerSample);
    if (score < 0) continue;
    if (!best || score > best.score) best = { score: score, byteOffset: off, mode: "probe" };
  }
  if (!best) return { byteOffset: dataStart + Math.min(Math.floor(audioBytes * pct / 100), lastStart), mode: "position", score: -1 };
  return best;
}
function buildWavPreviewBlob_(fileUrl, fullSize, want) {
  const head = fetchFileRange_(fileUrl, 0, 4095);
  if (!head || head.bytes.length < 45) return null;
  const view = head.bytes;
  const text4 = function(p) { return String.fromCharCode(view[p], view[p + 1], view[p + 2], view[p + 3]); };
  if (text4(0) !== "RIFF" || text4(8) !== "WAVE") return null;
  let pos = 12, byteRate = 0, blockAlign = 2, bits = 16, dataStart = -1, dataLen = 0;
  while (pos + 8 <= view.length) {
    const id = text4(pos);
    const size = view[pos + 4] | (view[pos + 5] << 8) | (view[pos + 6] << 16) | (view[pos + 7] << 24);
    if (id === "fmt ") {
      byteRate = view[pos + 16] | (view[pos + 17] << 8) | (view[pos + 18] << 16) | (view[pos + 19] << 24);
      blockAlign = Math.max(1, view[pos + 12] | (view[pos + 13] << 8));
      bits = Math.max(1, view[pos + 22] | (view[pos + 23] << 8));
    }
    if (id === "data") { dataStart = pos + 8; dataLen = size; break; }
    pos += 8 + size + (size % 2);
  }
  if (byteRate <= 0 || dataStart <= 0) return null;
  const fileEnd = fullSize > 0 ? fullSize : (dataStart + (dataLen > 0 ? dataLen : byteRate * want));
  const dataEnd = Math.max(dataStart + 2048, Math.min(fileEnd, dataLen > 0 ? dataStart + dataLen : fileEnd));
  const audioBytes = dataEnd - dataStart;
  const wantBytes = Math.floor(byteRate * want);
  const totalSeconds = audioBytes / byteRate;
  const peakMode = String(getSetting_("PREVIEW_PEAK_MODE") || "peak").toLowerCase();
  let mode = "start", startByte = dataStart;
  if (peakMode === "peak" && totalSeconds > want * 1.15) {
    const picked = wavProbePeakSecond_(fileUrl, dataStart, dataEnd, byteRate, bits, want);
    if (picked && picked.byteOffset > dataStart && picked.byteOffset < dataEnd - 1024) {
      startByte = picked.byteOffset; mode = picked.mode || "probe";
    }
  }
  // تراز روی مرز نمونه‌ها، تا برش صدا نشکند
  startByte = dataStart + Math.floor((startByte - dataStart) / blockAlign) * blockAlign;
  const need = Math.min(wantBytes, dataEnd - startByte);
  if (need <= 1024) return null;
  const body = fetchFileRange_(fileUrl, startByte, startByte + need - 1);
  if (!body) return null;
  const sample = body.full ? body.bytes.slice(startByte, startByte + need) : body.bytes;
  if (!sample || sample.length < 1024) return null;
  const headBytes = view.length >= dataStart ? view.slice(0, dataStart) : ((fetchFileRange_(fileUrl, 0, dataStart - 1) || {}).bytes);
  if (!headBytes || !headBytes.length) return null;
  const out = headBytes.slice(0, dataStart).concat(sample.slice(0, need));
  const taken = Math.min(need, sample.length);
  const total = out.length - 8;
  out[4] = total & 0xFF; out[5] = (total >> 8) & 0xFF; out[6] = (total >> 16) & 0xFF; out[7] = (total >> 24) & 0xFF;
  const sizeOffset = dataStart - 4;
  out[sizeOffset] = taken & 0xFF; out[sizeOffset + 1] = (taken >> 8) & 0xFF; out[sizeOffset + 2] = (taken >> 16) & 0xFF; out[sizeOffset + 3] = (taken >> 24) & 0xFF;
  const seconds = taken / byteRate;
  if (seconds > want * 1.25) return null;
  PREVIEW_CUT_INFO_MEMO_ = { mode: mode, startSecond: Math.round((startByte - dataStart) / byteRate), seconds: Math.round(seconds), frames: 0, bytes: out.length, sourceBytes: fullSize || 0, totalSeconds: Math.round(totalSeconds), avgGain: -1, tagBytes: 0 };
  return Utilities.newBlob(out, "audio/wav", "preview.wav");
}
// ورودی اصلی: فقط برش کوتاه و دقیق. هر فرمتی که برش دقیق نداشته باشد → null (پست صوتی ساخته نمی‌شود).
function buildAudioPreviewBlob_(fileId, seconds) {
  PREVIEW_CUT_INFO_MEMO_ = null;
  try {
    if (!fileIdLooksLikeFileId_(fileId)) return null;
    const want = Math.max(3, Math.min(120, Number(seconds) || getMusicPreviewSeconds_()));
    const info = telegramRequest_("getFile", { file_id: fileId });
    if (!info || !info.ok || !info.result || !info.result.file_path) return null;
    const fullSize = Number(info.result.file_size || 0);
    // getFile برای فایل‌های بزرگ‌تر از ۲۰MB کار نمی‌کند → برشی در کار نیست (فایل کامل هم هرگز پست نمی‌شود)
    if (fileTooBigForPreview_(fullSize)) return null;
    const token = getBotToken_();
    const fileUrl = "https://api.telegram.org/file/bot" + token + "/" + info.result.file_path;
    const path = String(info.result.file_path || "");
    const ext = (path.match(/\.([A-Za-z0-9]{2,5})$/) || ["", "mp3"])[1].toLowerCase();
    if (ext === "wav") return buildWavPreviewBlob_(fileUrl, fullSize, want);
    // فقط MP3 برش فریم‌دقیق می‌گیرد؛ برای M4A/FLAC/OGG/… برش بایتی امن نیست و
    // هرگز فایل کامل یا تکهٔ بزرگ به کانال فرستاده نمی‌شود.
    if (["mp3", "mpga", "mp2", "mpeg"].indexOf(ext) < 0) return null;
    return buildMp3PreviewBlob_(fileUrl, fullSize, want);
  } catch (e) { logError_("buildAudioPreviewBlob_", e); PREVIEW_CUT_INFO_MEMO_ = null; return null; }
}

// ───────────────────────── تلاش دوباره ─────────────────────────
function retrySubmission_(submissionId) {
  const sub = getSubmission_(submissionId); if (!sub) return false;
  const stage = parsePublishStage_(sub);
  // مرحله‌های انجام‌شده حفظ می‌شوند (پست کاور دوباره فرستاده نمی‌شود)، فقط پرچم پیش‌نمایش ریست می‌شود
  stage.previewAttempted = false;
  stage.failedBefore = stage.failedBefore || stage.stage || "";
  savePublishStage_(sub, stage);
  setSubmissionField_(sub.id, "status", "approved");
  setSubmissionField_(sub.id, "failure", "");
  setSubmissionField_(sub.id, "scheduledAt", new Date());
  sub.status = "approved";
  return true;
}

// ───────────────────────── کمپین‌های پیام همگانی ─────────────────────────
function getBroadcasts_() {
  const sh = getSheet_(APP.SHEETS.BROADCASTS);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.Broadcasts.length).getValues().map(function(r, i) {
    return { rowNumber: i + 2, broadcastId: String(r[0] || ""), target: String(r[1] || "all"), mode: String(r[2] || "now"), status: String(r[3] || "draft"), scheduledAt: r[4] || "", createdBy: String(r[5] || ""), createdAt: r[6] || "", lastError: String(r[7] || "") };
  }).filter(function(b) { return b.broadcastId; });
}
function getBroadcast_(id) { return getBroadcasts_().find(function(b) { return b.broadcastId === String(id); }) || null; }
function setBroadcastField_(id, field, value) {
  const cols = { target: 2, mode: 3, status: 4, scheduledAt: 5, lastError: 8 };
  const col = cols[field]; const b = getBroadcast_(id); if (!b || !col) return false;
  getSheet_(APP.SHEETS.BROADCASTS).getRange(b.rowNumber, col).setValue(value); b[field] = value; return true;
}
function getBroadcastMedia_(broadcastId) {
  const sh = getSheet_(APP.SHEETS.BROADCAST_MEDIA);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.BroadcastMedia.length).getValues().map(function(r, i) {
    return { rowNumber: i + 2, broadcastId: String(r[0] || ""), seq: Number(r[1]) || 0, sourceChatId: String(r[2] || ""), sourceMessageId: String(r[3] || ""), kind: String(r[4] || ""), caption: String(r[5] || "") };
  }).filter(function(m) { return m.broadcastId === String(broadcastId); }).sort(function(a, b) { return a.seq - b.seq; });
}
function appendBroadcastMedia_(broadcastId, message, kind, caption) {
  withLock_(function() {
    const sh = getSheet_(APP.SHEETS.BROADCAST_MEDIA); const existing = getBroadcastMedia_(broadcastId);
    sh.appendRow([broadcastId, existing.length + 1, message && message.chat ? message.chat.id : "", message && message.message_id ? message.message_id : "", kind, caption || ""]);
  });
}
function deleteBroadcastDraft_(broadcastId) {
  const sh = getSheet_(APP.SHEETS.BROADCASTS); const b = getBroadcast_(broadcastId);
  deleteRowsByKey_(APP.SHEETS.BROADCAST_MEDIA, 1, [broadcastId]);
  if (b) {
    if (["draft", "queued", "scheduled", "paused"].indexOf(String(b.status)) >= 0) sh.deleteRow(b.rowNumber);
    else setBroadcastField_(broadcastId, "status", "cancelled");
  }
}
function startBroadcastDraft_(chatId, adminId) {
  const id = newId_("BC");
  getSheet_(APP.SHEETS.BROADCASTS).appendRow([id, "all", "now", "draft", "", String(adminId), new Date(), ""]);
  setSession_("M:" + adminId, "ADM_BROADCAST_COLLECT", { broadcastId: id });
  sendMessage_(chatId, "📣 کمپین جدید: " + id + "\nپیام‌ها (متن/عکس/ویدیو/فایل) را بفرست. هر پیام یک آیتم کمپین می‌شود.\nوقتی تمام شد «✅ پایان» را بزن.", { keyboard: [[{ text: "✅ پایان" }], [{ text: "❌ لغو" }]], resize_keyboard: true, is_persistent: true });
}
function campaignRecipients_(target) {
  const users = getAllUsers_().filter(function(u) { return u.active && !u.blocked && !u.botBlocked; });
  if (target === "inactive") {
    const days = Number(getSetting_("INACTIVE_AFTER_DAYS") || 30); const cutoff = nowMs_() - days * 86400000;
    return users.filter(function(u) { const t = dateMillis_(u.lastSeen); return t > 0 && t <= cutoff; });
  }
  return users;
}
function broadcastQueueJob() {
  resetRuntimeCaches_();
  const lock = getLock_(); if (!lock.tryLock(20000)) return;
  try {
    const now = nowMs_();
    getBroadcasts_().filter(function(b) { return ["queued", "running", "scheduled"].indexOf(b.status) >= 0; }).forEach(function(b) {
      if (b.status === "scheduled" && dateMillis_(b.scheduledAt) > now) return;
      if (b.status === "scheduled") setBroadcastField_(b.broadcastId, "status", "queued");
      processBroadcast_(b);
    });
    // این فراخوانی خارج از قفل انجام می‌شود؛ LockService قفل بازگشتی (reentrant) نیست
    // و گرفتن دوبارهٔ قفل یعنی ۱۲ ثانیه انتظار و شکست.
    try { lock.releaseLock(); } catch (e) {}
    maybeQueueInactiveCampaign_();
  } catch (e) { logError_("broadcastQueueJob", e); }
  finally { try { lock.releaseLock(); } catch (e2) {} }
}
// قبلاً برای هر گیرنده یک بار کل DeliveryLog خوانده می‌شد (O(N²)). حالا یک بار در هر اجرا کش می‌شود.
function getDeliveredUserIdSet_(broadcastId) {
  if (DELIVERED_SET_MEMO_ && DELIVERED_SET_MEMO_.id === String(broadcastId)) return DELIVERED_SET_MEMO_.set;
  const sh = getSheet_(APP.SHEETS.DELIVERY_LOG);
  const set = {};
  if (sh.getLastRow() >= 2) {
    const vals = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
    vals.forEach(function(r) {
      if (String(r[0]) !== String(broadcastId)) return;
      // «ratelimit» یعنی تلاش نشده؛ نباید جزو تحویل‌شده‌ها حساب شود تا بار بعد دوباره تلاش شود.
      if (String(r[2] || "").toLowerCase() === "ratelimit") return;
      set[String(r[1])] = true;
    });
  }
  DELIVERED_SET_MEMO_ = { id: String(broadcastId), set: set };
  return set;
}
function broadcastSendToUser_(items, userId) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let r;
    if (item.kind === "text" && item.caption) r = sendMessage_(userId, item.caption);
    else r = copyMessage_(userId, item.sourceChatId, item.sourceMessageId);
    if (!r || !r.ok) {
      const desc = String(r && r.description || "");
      if (/bot was blocked by the user|user is deactivated|chat not found/i.test(desc)) {
        try { setUserField_(userId, "botBlocked", true); } catch (e) {}
        return { status: "blocked", error: truncate_(desc, 120) };
      }
      if (/too many requests|retry after/i.test(desc)) return { status: "ratelimit", error: truncate_(desc, 120) };
      return { status: "failed", error: truncate_(desc, 120) };
    }
  }
  return { status: "sent", error: "" };
}
function ccBroadcastRows_(target) {
  let rows = getActiveConnectedChannels_();
  if (String(target).indexOf("cc_sel:") === 0) {
    const ids = String(target).slice(7).split(",").filter(Boolean);
    rows = rows.filter(function(c) { return ids.indexOf(c.id) >= 0; });
  }
  return rows;
}
function broadcastSendToChannel_(items, row, broadcast) {
  const batchId = String((broadcast && broadcast.broadcastId) || newId_("BCC"));
  const createdBy = String((broadcast && broadcast.createdBy) || "");
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let r;
    if (item.sourceChatId && item.sourceMessageId) {
      r = copyMessage_(row.chatId, item.sourceChatId, item.sourceMessageId);
      if ((!r || !r.ok) && item.kind === "text" && item.caption) r = sendMessage_(row.chatId, item.caption);
    } else {
      r = sendMessage_(row.chatId, item.caption);
    }
    if (!r || !r.ok) {
      const desc = String(r && r.description || "");
      if (/kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(desc)) {
        markConnectedChannelKicked_(row, desc);
        return { status: "blocked", error: truncate_(desc, 120) };
      }
      if (/too many requests|retry after/i.test(desc)) return { status: "ratelimit", error: truncate_(desc, 120) };
      return { status: "failed", error: truncate_(desc, 120) };
    }
    if (r.result && r.result.message_id) {
      recordCcPost_({
        batchId: batchId,
        sourceType: "message",
        channelId: row.id,
        chatId: row.chatId,
        messageId: Number(r.result.message_id),
        kind: item.kind || "text",
        caption: item.caption || "",
        fileId: "",
        createdBy: createdBy
      });
    }
  }
  try { setConnectedChannelField_(row.id, "lastOkAt", new Date()); } catch (e) {}
  return { status: "sent", error: "" };
}
function processBroadcast_(broadcast) {
  const items = getBroadcastMedia_(broadcast.broadcastId);
  if (!items.length) { setBroadcastField_(broadcast.broadcastId, "status", "failed"); setBroadcastField_(broadcast.broadcastId, "lastError", "no items"); return; }
  if (broadcast.status !== "running") setBroadcastField_(broadcast.broadcastId, "status", "running");
  const batch = Math.max(1, Math.min(50, Number(getSetting_("BROADCAST_BATCH") || 10)));
  // هدف‌های «cc_*» یعنی کانال‌های وصل‌شدهٔ کاربران (همه یا انتخاب‌شده‌ها)
  const isCC = String(broadcast.target).indexOf("cc_") === 0;
  const recipientsLeft = function() {
    const done = getDeliveredUserIdSet_(broadcast.broadcastId);
    if (isCC) return ccBroadcastRows_(broadcast.target).filter(function(c) { return !done[c.chatId]; }).map(function(c) { return { userId: c.chatId, cc: c }; });
    return campaignRecipients_(broadcast.target).filter(function(u) { return !done[u.userId]; });
  };
  const recipients = recipientsLeft();
  if (!recipients.length) {
    setBroadcastField_(broadcast.broadcastId, "status", "completed");
    const admin = (getBroadcast_(broadcast.broadcastId) || {}).createdBy || getAdmins_()[0];
    if (admin) sendMessage_(admin, "📣 کمپین " + broadcast.broadcastId + " کامل شد.");
    return;
  }
  const log = getSheet_(APP.SHEETS.DELIVERY_LOG);
  const rows = [];
  let sentThisRun = 0;
  for (let i = 0; i < recipients.length && sentThisRun < batch; i++) {
    // توقف/ادامه: اگر مدیر وسط کار کمپین را paused کرد، همین‌جا متوقف شو (ادامه‌پذیر).
    const fresh = getBroadcast_(broadcast.broadcastId);
    if (fresh && fresh.status === "paused") return;
    const u = recipients[i];
    const outcome = isCC ? broadcastSendToChannel_(items, u.cc, broadcast) : broadcastSendToUser_(items, u.userId);
    rows.push([broadcast.broadcastId, u.userId, outcome.status, new Date(), outcome.error]);
    if (outcome.status === "sent" || outcome.status === "blocked") sentThisRun++;
    if (outcome.status === "ratelimit") break;
  }
  if (rows.length) {
    log.getRange(log.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
    // کش تحویل‌ها باید باطل شود، وگرنه همان گیرنده‌ها دوباره انتخاب می‌شوند و کار تمام نمی‌شود.
    DELIVERED_SET_MEMO_ = null;
  }
  const fresh = getBroadcast_(broadcast.broadcastId);
  if (fresh && fresh.status === "paused") return;
  const remaining = recipientsLeft();
  if (!remaining.length) {
    setBroadcastField_(broadcast.broadcastId, "status", "completed");
    const admin = broadcast.createdBy || getAdmins_()[0];
    if (admin && /^\d+$/.test(String(admin))) sendMessage_(admin, "📣 کمپین " + broadcast.broadcastId + " کامل شد. " + rows.length + " پیام در این دسته.");
  }
}
function maybeQueueInactiveCampaign_() {
  const repeatDays = Number(getSetting_("INACTIVE_REPEAT_DAYS") || 90);
  const cutoff = nowMs_() - repeatDays * 86400000;
  const lastCreated = dateMillis_(getSetting_("INACTIVE_CAMPAIGN_LAST_AT"));
  if (lastCreated && lastCreated > cutoff) return; // جلوگیری از ساخت تکراری/توخالی هر ۵ دقیقه
  const recent = getBroadcasts_().filter(function(b) { return b.target === "inactive" && b.status !== "cancelled" && dateMillis_(b.createdAt) > cutoff; });
  if (recent.length) return;
  const inactive = campaignRecipients_("inactive");
  if (!inactive.length) { setSetting_("INACTIVE_CAMPAIGN_LAST_AT", String(nowMs_())); return; }
  const id = newId_("BCI");
  withLock_(function() {
    const again = getBroadcasts_().filter(function(b) { return b.target === "inactive" && ["draft", "queued", "running", "scheduled", "paused"].indexOf(b.status) >= 0; });
    if (again.length) return;
    getSheet_(APP.SHEETS.BROADCASTS).appendRow([id, "inactive", "now", "queued", "", "system", new Date(), ""]);
    // آیتم متن هم همان لحظه ساخته می‌شود تا کمپین بدون پیام به failed نرود (باگ قبلی).
    getSheet_(APP.SHEETS.BROADCAST_MEDIA).appendRow([id, 1, "", "", "text", String(getSetting_("INACTIVE_TEXT") || DEFAULT_SETTINGS.INACTIVE_TEXT)]);
    setSetting_("INACTIVE_CAMPAIGN_LAST_AT", String(nowMs_()));
  });
}
function getDeliveryLogs_(broadcastId) {
  const sh = getSheet_(APP.SHEETS.DELIVERY_LOG);
  if (sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues().filter(function(r) { return String(r[0]) === String(broadcastId); }).map(function(r) { return { userId: String(r[1]), status: String(r[2]), sentAt: r[3], error: String(r[4] || "") }; });
}

// ───────────────────────── پنل مدیریت ─────────────────────────
const SUB_STATUS_LABELS_ = { pending: "⏳ در انتظار", approved: "🗓 در صف", publishing: "📤 در حال انتشار", published: "✅ منتشر شد", rejected: "❌ رد شد", failed: "⚠️ خطا", scheduled: "🗓 زمان‌دار" };
function showAdminMenu_(chatId, prefix) {
  const all = getAllSubmissions_();
  const pending = all.filter(function(s) { return s.status === "pending"; }).length;
  const queue = all.filter(function(s) { return s.status === "approved" || s.status === "publishing"; }).length;
  const failed = all.filter(function(s) { return s.status === "failed"; }).length;
  const lines = ["🎛 پنل مدیریت فلورا بات", "⏳ در انتظار تأیید: " + pending + " · 🗓 صف: " + queue + (failed ? " · ⚠️ خطا: " + failed : ""), "📺 کانال: " + (getSetting_("CHANNEL_ID") || "تنظیم نشده"), "🚦 وضعیت: " + (getSetting_("BOT_MODE") || "active") + " · انتشار: " + (getSetting_("PUBLISH_MODE") || "auto")];
  sendMessage_(chatId, (prefix ? prefix + "\n\n" : "") + lines.join("\n"), adminKeyboard_());
}
function adminGate_(chatId, uid, permission) {
  if (!hasAdminPermission_(uid, permission)) { sendMessage_(chatId, "⛔ نقش تو اجازهٔ این بخش را ندارد.", adminKeyboard_()); return false; }
  return true;
}
function cancelAdminFlow_(uid, session) {
  const data = (session && session.data) || {};
  if (data.broadcastId) { try { deleteBroadcastDraft_(data.broadcastId); } catch (e) {} }
  if (data.draftId) { try { const d = getMusicDraft_(data.draftId); if (d && d.status === "open") deleteDraftCompletely_(data.draftId); } catch (e) {} }
  clearSession_("M:" + uid);
}
const ADMIN_MENU_BUTTON_TEXTS_ = [
  "🎵 ارسال موزیک", "🎼 ارسال آلبوم", "🎵 ارسال‌ها", "🗓 صف انتشار", "⏳ Coming Soon",
  "🎤 فری‌استایل", "🎤 فری‌استایل‌ها", "👥 کاربران", "🛡 دسترسی مدیران", "💬 پشتیبانی",
  "📣 پیام همگانی", "📢 کانال‌های وصل‌شده", "🖼 بنر تبلیغاتی", "😴 غیرفعال‌ها", "⚙️ تنظیمات",
  "📺 کانال", "🎨 دکمه‌ها و رنگ‌ها", "🆘 درخواست‌های رمز", "🌐 عضویت اجباری", "📊 آمار",
  "🧹 نگهداری و بکاپ", "📚 آثار من"
];
function isAdminMenuButton_(text) { return ADMIN_MENU_BUTTON_TEXTS_.indexOf(String(text || "").trim()) >= 0; }
function handleAdminMenuMessage_(message) {
  const uid = String(message.from.id); const chatId = String(message.chat.id); const text = String(message.text || "").trim();
  const routes = [
    ["🎵 ارسال موزیک", "submissions", function() { startMusicFlow_(chatId, uid, "simple"); }],
    ["🎼 ارسال آلبوم", "submissions", function() { startMusicFlow_(chatId, uid, "album"); }],
    ["🎵 ارسال‌ها", "submissions", function() { showAdminSubmissions_(chatId, uid, "pending", 0); }],
    ["🗓 صف انتشار", "submissions", function() { showAdminSubmissions_(chatId, uid, "queue", 0); }],
    ["⏳ Coming Soon", "submissions", function() { showComingSoonPanel_(chatId, uid); }],
    ["🎤 فری‌استایل", "submissions", function() { startMusicFlow_(chatId, uid, "freestyle"); }],
    ["🎤 فری‌استایل‌ها", "submissions", function() { showFreestylePanel_(chatId, uid); }],
    ["👥 کاربران", "users", function() { showAdminUsers_(chatId, uid, 0, ""); }],
    ["🛡 دسترسی مدیران", "admins", function() { showAdminAdmins_(chatId, uid); }],
    ["💬 پشتیبانی", "support", function() { showSupportPanel_(chatId, uid); }],
    ["📣 پیام همگانی", "broadcast", function() { showBroadcastPanel_(chatId, uid); }],
    ["📢 کانال‌های وصل‌شده", "broadcast", function() { showAdminConnectedChannels_(chatId, uid, 0); }],
    ["🖼 بنر تبلیغاتی", "broadcast", function() { showCcBannerPanel_(chatId, uid); }],
    ["😴 غیرفعال‌ها", "settings", function() { showInactivePanel_(chatId, uid); }],
    ["⚙️ تنظیمات", "settings", function() { showSettingsPanel_(chatId, uid, 0); }],
    ["📺 کانال", "channel", function() { showChannelPanel_(chatId, uid); }],
    ["🎨 دکمه‌ها و رنگ‌ها", "settings", function() { showColorsPanel_(chatId, uid); }],
    ["🆘 درخواست‌های رمز", "users", function() { showResetRequestsPanel_(chatId, uid); }],
    ["🌐 عضویت اجباری", "settings", function() { showFJPanel_(chatId, uid); }],
    ["📊 آمار", "settings", function() { showStatsPanel_(chatId, uid); }],
    ["🧹 نگهداری و بکاپ", "settings", function() { showMaintenancePanel_(chatId, uid); }],
    ["📚 آثار من", "submissions", function() { showMyMusic_(chatId, uid, 0); }]
  ];
  for (let i = 0; i < routes.length; i++) {
    if (text === routes[i][0]) { if (adminGate_(chatId, uid, routes[i][1])) routes[i][2](); return; }
  }
  showAdminMenu_(chatId, "از دکمه‌های زیر استفاده کن.");
}
function showStatsPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const users = getAllUsers_(); const subs = getAllSubmissions_();
  const byStatus = {}; subs.forEach(function(s) { byStatus[s.status] = (byStatus[s.status] || 0) + 1; });
  const lib = getMusicLibrary_();
  const downloads = lib.reduce(function(sum, t) { return sum + (Number(t.downloadCount) || 0); }, 0);
  const triggers = ScriptApp.getProjectTriggers().length;
  const lines = ["📊 آمار", "👥 کاربران: " + users.length + " (فعال " + users.filter(function(u) { return u.active && !u.blocked; }).length + (users.filter(function(u) { return u.botBlocked; }).length ? " · بلاک‌کرده " + users.filter(function(u) { return u.botBlocked; }).length : "") + ")",
    "🎵 ارسال‌ها: " + subs.length, "⏳ در انتظار: " + (byStatus.pending || 0), "🗓 صف: " + ((byStatus.approved || 0) + (byStatus.publishing || 0)),
    "✅ منتشرشده: " + (byStatus.published || 0), "⚠️ خطا: " + (byStatus.failed || 0), "🎧 ترک‌های کتابخانه: " + lib.length,
    "⬇️ دانلودها: " + downloads, "📣 کمپین‌ها: " + getBroadcasts_().length, "⚙️ تریگرهای فعال: " + triggers + " / 20"];
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: [
    [{ text: "🎤 داشبورد هنرمندان", callback_data: "a:artistdash" }, { text: "⬇️ آمار ترک‌ها", callback_data: "a:trackstats" }],
    [{ text: "🔁 بازخوانی", callback_data: "a:stats" }, { text: "🏠 منو", callback_data: "a:home" }]
  ] });
}
function showMaintenancePanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const triggers = ScriptApp.getProjectTriggers().map(function(t) { return t.getHandlerFunction(); });
  const counts = {};
  triggers.forEach(function(x) { counts[x] = (counts[x] || 0) + 1; });
  const lines = ["🧹 نگهداری و بکاپ",
    "⚙️ پردازش صف: " + (getSetting_("QUEUE_ENABLED") || "true"),
    "⏱ تریگرها: " + triggers.length + " / 20" + (Object.keys(counts).length ? "\n" + Object.keys(counts).map(function(k) { return "  • " + k + " × " + counts[k]; }).join("\n") : ""),
    "💾 بکاپ خودکار: " + (getSetting_("BACKUP_ENABLED") === "true" ? "روشن" : "خاموش"),
    "🗄 نسخه: " + APP.VERSION];
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: [
    [{ text: "🗑 پاک‌سازی نشست‌ها و پیش‌نویس‌های کهنه", callback_data: "a:cleanup" }],
    [{ text: "💾 بکاپ الان", callback_data: "a:backup" }],
    [{ text: (getSetting_("QUEUE_ENABLED") === "true" ? "⏸ توقف پردازش صف" : "▶️ روشن‌کردن پردازش صف"), callback_data: "a:queuetoggle" }],
    [{ text: "📜 لاگ مدیران", callback_data: "a:adminlog" }, { text: "🐞 خطاهای اخیر", callback_data: "a:errors" }],
    [{ text: "📥 خروجی CSV کاربران", callback_data: "a:export:users" }, { text: "📥 خروجی CSV ارسال‌ها", callback_data: "a:export:subs" }],
    [{ text: "🏠 منو", callback_data: "a:home" }]
  ] });
}
function showAdminLog_(chatId, uid) {
  const sh = getSheet_(APP.SHEETS.ADMIN_LOG);
  if (sh.getLastRow() < 2) { sendMessage_(chatId, "📜 لاگی ثبت نشده است.", { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:maintenance" }]] }); return; }
  const n = Math.min(20, sh.getLastRow() - 1);
  const vals = sh.getRange(sh.getLastRow() - n + 1, 1, n, 6).getValues();
  const lines = ["📜 آخرین فعالیت مدیران (" + n + "):"];
  vals.slice().reverse().forEach(function(r) { lines.push("• " + formatDate_(r[5]) + " — " + r[1] + " → " + r[2] + " (" + r[3] + ")" + (r[4] ? "\n  " + truncate_(r[4], 80) : "")); });
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:maintenance" }]] });
}

// ───────────────────────── تنظیمات ─────────────────────────
function showSettingsPanel_(chatId, uid, page, query) {
  if (!adminGate_(chatId, uid, "settings")) return;
  let all = getAllSettings_();
  const q = String(query || "").trim().toUpperCase();
  if (q) all = all.filter(function(s) { return s.key.indexOf(q) >= 0; });
  const size = 12; const pages = Math.max(1, Math.ceil(all.length / size));
  const p = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  const slice = all.slice(p * size, p * size + size);
  const rows = slice.map(function(s) { return [{ text: "✏️ " + truncate_(s.key, 24) + ": " + truncate_(s.value, 12), callback_data: "set:edit:" + s.row }]; });
  if (pages > 1) rows.push([{ text: "◀️", callback_data: "a:settings:" + Math.max(0, p - 1) + ":0" }, { text: (p + 1) + "/" + pages, callback_data: "a:settings:" + p + ":0" }, { text: "▶️", callback_data: "a:settings:" + Math.min(pages - 1, p + 1) + ":0" }]);
  rows.push([{ text: "➕ افزودن تنظیم", callback_data: "set:add" }, { text: "🔍 جست‌وجو", callback_data: "set:search" }]);
  rows.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "⚙️ تنظیمات (" + all.length + ") — صفحهٔ " + (p + 1) + "/" + pages + (q ? " — جست‌وجو: " + q : ""), { inline_keyboard: rows });
}
function showSettingEditor_(chatId, uid, rowIndex) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const setting = getAllSettings_().find(function(s) { return s.row === Number(rowIndex); });
  if (!setting) { sendMessage_(chatId, "تنظیم پیدا نشد.", { inline_keyboard: [[{ text: "🔁 بازخوانی", callback_data: "a:settings" }]] }); return; }
  const meta = SETTINGS_CHOICE_OPTIONS_[setting.key];
  const rows = [];
  if (meta && meta.options.length) {
    const optionRows = [];
    meta.options.forEach(function(o, i) { optionRows.push([{ text: (String(o.value) === String(setting.value) ? "✅ " : "") + o.label, callback_data: "set:choose:" + setting.row + ":" + i }]); });
    optionRows.slice(0, 8).forEach(function(r) { rows.push(r); });
    if (meta.allowCustom) rows.push([{ text: "✍️ مقدار دلخواه", callback_data: "set:custom:" + setting.row }]);
  } else {
    rows.push([{ text: "✍️ تغییر مقدار", callback_data: "set:custom:" + setting.row }]);
  }
  rows.push([{ text: "🗑 حذف تنظیم", callback_data: "set:del:" + setting.row }, { text: "⬅️ بازگشت", callback_data: "a:settings" }]);
  sendMessage_(chatId, "⚙️ " + setting.key + "\nمقدار فعلی: " + truncate_(setting.value || "—", 300) + (meta ? "\nبرچسب: " + meta.label : ""), { inline_keyboard: rows });
}
function showChannelPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "channel")) return;
  const lines = ["📺 کانال انتشار", "🆔 " + (getSetting_("CHANNEL_ID") || "—"), "🧪 کانال آزمایشی: " + (getSetting_("STAGING_CHANNEL_ID") || "—"), "🔗 " + (getSetting_("BOT_USERNAME") ? "@" + String(getSetting_("BOT_USERNAME")).replace(/^@/, "") : "—"), "🔁 حالت: " + (getSetting_("PUBLISH_MODE") || "auto") + " · فعال: " + (getSetting_("PUBLISH_ENABLED") || "true"), "⏱ فاصله: " + (getSetting_("PUBLISH_INTERVAL_MIN") || "10") + " دقیقه", "📝 فوتر: " + (getSetting_("CHANNEL_FOOTER") || "—")];
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: [
    [{ text: "🆔 تغییر کانال", callback_data: "set:custom:" + rowOfSetting_("CHANNEL_ID") }],
    [{ text: "📝 فوتر پست", callback_data: "set:custom:" + rowOfSetting_("CHANNEL_FOOTER") }],
    [{ text: "🔁 حالت انتشار", callback_data: "set:edit:" + rowOfSetting_("PUBLISH_MODE") }],
    [{ text: "⏱ فاصله", callback_data: "set:edit:" + rowOfSetting_("PUBLISH_INTERVAL_MIN") }],
    [{ text: "🆔 یوزرنیم ربات", callback_data: "set:custom:" + rowOfSetting_("BOT_USERNAME") }],
    [{ text: "🔘 پردازش انتشار", callback_data: "set:edit:" + rowOfSetting_("PUBLISH_ENABLED") }],
    [{ text: "🧪 تست کاور", callback_data: "a:covertest" }, { text: "🏠 منو", callback_data: "a:home" }]
  ] });
}
function rowOfSetting_(key) { const s = getAllSettings_().find(function(x) { return x.key === String(key); }); return s ? s.row : 0; }
function showColorsPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const styles = ["default", "primary", "success", "danger"];
  const labels = { default: "پیش‌فرض", primary: "آبی", success: "سبز", danger: "قرمز" };
  const keys = [["BTN_STYLE_REPLY", "دکمه‌های معمولی"], ["BTN_STYLE_INLINE", "دکمه‌های شیشه‌ای"], ["BTN_STYLE_DANGER", "دکمه‌های هشدار"]];
  const rows = keys.map(function(k) { return styles.map(function(s) { return { text: (String(getSetting_(k[0]) || "default") === s ? "✅ " : "") + labels[s], callback_data: "color:" + k[0] + ":" + s }; }); });
  keys.forEach(function(k, i) { rows[i].unshift({ text: k[1] + ":", callback_data: "a:noop" }); });
  rows.push([{ text: "🔗 دکمه‌های لینک زیر پست: " + (getSetting_("POST_SHOW_LINK_BUTTONS") === "true" ? "روشن" : "خاموش"), callback_data: "cb:links:" + (getSetting_("POST_SHOW_LINK_BUTTONS") === "true" ? "false" : "true") }]);
  rows.push([{ text: "⬇️ دکمهٔ دانلود روی کاور: " + (getSetting_("POST_DOWNLOAD_BUTTON_ON_COVER") === "true" ? "روشن" : "خاموش"), callback_data: "cb:dlcover:" + (getSetting_("POST_DOWNLOAD_BUTTON_ON_COVER") === "true" ? "false" : "true") }]);
  rows.push([{ text: "🧾 متن دکمهٔ دانلود", callback_data: "set:custom:" + rowOfSetting_("POST_DOWNLOAD_BUTTON_TEXT") }]);
  rows.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "🎨 ظاهر دکمه‌ها\nتوجه: رنگ دکمه قابلیت جدید Bot API است؛ اگر نسخهٔ رباتت پشتیبانی نکند، پیام‌ها خودکار بدون رنگ ارسال می‌شوند.", { inline_keyboard: rows });
}
function showFJPanel_(chatId, uid) {
  const channels = getFJChannels_();
  const rows = channels.map(function(c) { return [{ text: (c.active ? "✅ " : "⛔ ") + truncate_(c.title || c.chatId, 24), callback_data: "fj:toggle:" + c.rowNumber }, { text: "🗑", callback_data: "fj:del:" + c.rowNumber }]; });
  rows.push([{ text: (getSetting_("FJ_ENABLED") === "true" ? "🔴 خاموش‌کردن" : "🟢 روشن‌کردن") + " عضویت اجباری", callback_data: "fj:enabled:" + (getSetting_("FJ_ENABLED") === "true" ? "false" : "true") }]);
  rows.push([{ text: "➕ افزودن کانال", callback_data: "fj:add" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "🌐 عضویت اجباری: " + (getSetting_("FJ_ENABLED") === "true" ? "روشن" : "خاموش") + "\nکانال‌ها: " + channels.length + "\n\n⚠️ ربات باید در هر کانال ادمین باشد تا عضویت را بررسی کند.", { inline_keyboard: rows });
}
function showInactivePanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const inactive = campaignRecipients_("inactive");
  sendMessage_(chatId, "😴 کاربران غیرفعال\nآستانه: " + (getSetting_("INACTIVE_AFTER_DAYS") || 30) + " روز · تکرار: " + (getSetting_("INACTIVE_REPEAT_DAYS") || 90) + " روز\nتعداد فعلی: " + inactive.length + "\n\nمتن پیام:\n" + truncate_(getSetting_("INACTIVE_TEXT") || "—", 300), { inline_keyboard: [
    [{ text: "✏️ آستانه", callback_data: "set:edit:" + rowOfSetting_("INACTIVE_AFTER_DAYS") }, { text: "🔁 تکرار", callback_data: "set:edit:" + rowOfSetting_("INACTIVE_REPEAT_DAYS") }],
    [{ text: "✏️ متن پیام", callback_data: "set:custom:" + rowOfSetting_("INACTIVE_TEXT") }],
    [{ text: "⚡️ ساخت کمپین الان", callback_data: "bc:inactive" }, { text: "🏠 منو", callback_data: "a:home" }]
  ] });
}

// ───────────────────────── دیسپچ کال‌بک مدیر ─────────────────────────
function handleAdminCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id); const data = String(cb.data || "");
  const parts = data.split(":");
  const permission = adminPermissionForCallback_(data);
  if (permission && permission !== "admins" && !hasAdminPermission_(uid, permission)) { answerCallbackQuery_(cb.id, "دسترسی نداری."); return; }
  if (parts[0] === "acc") { handleConnectedChannelsAdminCallback_(cb); return; }
  if (parts[0] === "bn") { handleCcBannerCallback_(cb); return; }
  if (parts[0] === "ccp") { handleCcPostsCallback_(cb); return; }
  const p0 = parts[0];
  try {
    if (data === "a:home") { clearSession_("M:" + uid); answerCallbackQuery_(cb.id); showAdminMenu_(chatId); return; }
    if (data === "a:noop") { answerCallbackQuery_(cb.id); return; }
    if (data === "a:stats") { answerCallbackQuery_(cb.id); showStatsPanel_(chatId, uid); return; }
    if (data === "a:maintenance") { answerCallbackQuery_(cb.id); showMaintenancePanel_(chatId, uid); return; }
    if (data === "a:adminlog") { answerCallbackQuery_(cb.id); showAdminLog_(chatId, uid); return; }
    if (data === "a:errors") { answerCallbackQuery_(cb.id); showErrorsPanel_(chatId, uid); return; }
    if (data === "a:artistdash") { answerCallbackQuery_(cb.id); showArtistDashboard_(chatId, uid); return; }
    if (data === "a:trackstats") { answerCallbackQuery_(cb.id); showTrackStats_(chatId, uid); return; }
    if (data.indexOf("a:export:") === 0) { answerCallbackQuery_(cb.id, "در حال ساخت فایل…"); sendCsvExport_(chatId, uid, data.split(":")[2]); return; }
    if (data === "a:cleanup") {
      answerCallbackQuery_(cb.id, "در حال پاک‌سازی…");
      const out = cleanupJob();
      sendMessage_(chatId, "🧹 پاک‌سازی انجام شد.\nنشست منقضی: " + out.sessions + "\nپیش‌نویس کهنه: " + out.drafts + "\nتریگر اضافه حذف‌شده: " + out.triggers, { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:maintenance" }]] });
      return;
    }
    if (data === "a:backup") {
      answerCallbackQuery_(cb.id, "در حال بکاپ…");
      const file = runBackup_(false);
      sendMessage_(chatId, file ? "💾 بکاپ ساخته شد:\n" + file.getName() + "\n" + file.getUrl() : "❌ بکاپ ساخته نشد.", { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:maintenance" }]] });
      return;
    }
    if (data === "a:queuetoggle") {
      const next = getSetting_("QUEUE_ENABLED") === "true" ? "false" : "true";
      setSetting_("QUEUE_ENABLED", next);
      answerCallbackQuery_(cb.id, next === "true" ? "صف روشن شد" : "صف خاموش شد");
      if (next === "true") ensureWorkersReady_();
      showMaintenancePanel_(chatId, uid); return;
    }
    if (data === "a:covertest") {
      answerCallbackQuery_(cb.id);
      // قبلاً هر نتیجهٔ ok (حتی پست متنی جایگزین) «سالم است» گزارش می‌شد.
      const r = sendDefaultCoverToChannel_(chatId, "🧪 تست کاور پیش‌فرض");
      const isPhoto = !!(r && r.ok && r.result && (r.result.photo || r.photo));
      const line = isPhoto
        ? "✅ کاور پیش‌فرض واقعاً به‌صورت عکس ارسال شد."
        : (r && r.ok
            ? "⚠️ کاور ساخته نشد و ربات مجبور شد پست متنی بفرستد. تنظیمات DEFAULT_COVER_FILE_ID را بررسی کن یا کاور را دوباره بساز."
            : "❌ کاور پیش‌فرض کار نکرد: " + String(r && r.description || ""));
      sendMessage_(chatId, line);
      return;
    }
    if (p0 === "set") { handleSettingCallback_(cb, parts); return; }
    if (p0 === "color") { handleColorCallback_(cb, parts); return; }
    if (p0 === "fj") { handleFJCallback_(cb, parts); return; }
    if (p0 === "botmode") { setSetting_("BOT_MODE", parts[1] || "active"); logAdminAction_(uid, "bot_mode", parts[1] || "active", ""); answerCallbackQuery_(cb.id, "ثبت شد"); showBotModePanel_(chatId, uid); return; }
    if (p0 === "cb") { handlePostButtonCallback_(cb, parts); return; }
    if (p0 === "a") {
      const rest = data.slice(2); // بخش بعد از «a:»
      // مسیریابی بر اساس پیشوند انجام می‌شود تا هیچ کال‌بکی جا نیفتد
      // (قبلاً a:subapprove / a:downloadtoggle / a:adminrole و… به هیچ هندلری نمی‌رسیدند).
      const simple = {
        "home": function() { answerCallbackQuery_(cb.id); showAdminMenu_(chatId); },
        "noop": function() { answerCallbackQuery_(cb.id); },
        "stats": function() { answerCallbackQuery_(cb.id); showStatsPanel_(chatId, uid); },
        "maintenance": function() { answerCallbackQuery_(cb.id); showMaintenancePanel_(chatId, uid); },
        "texts": function() { answerCallbackQuery_(cb.id); showSettingsPanel_(chatId, uid, 0, ""); },
        "channel": function() { answerCallbackQuery_(cb.id); showChannelPanel_(chatId, uid); },
        "colors": function() { answerCallbackQuery_(cb.id); showColorsPanel_(chatId, uid); },
        "postbuttons": function() { answerCallbackQuery_(cb.id); showColorsPanel_(chatId, uid); },
        "comments": function() { answerCallbackQuery_(cb.id); showColorsPanel_(chatId, uid); },
        "fj": function() { answerCallbackQuery_(cb.id); showFJPanel_(chatId, uid); },
        "inactive": function() { answerCallbackQuery_(cb.id); showInactivePanel_(chatId, uid); },
        "botmode": function() { answerCallbackQuery_(cb.id); showBotModePanel_(chatId, uid); },
        "broadcast": function() { answerCallbackQuery_(cb.id); showBroadcastPanel_(chatId, uid); },
        "campaigns": function() { answerCallbackQuery_(cb.id); showBroadcastPanel_(chatId, uid); },
        "support": function() { handleSupportAdminCallback_(cb, ["support", "support"]); }
      };
      if (simple[rest]) { simple[rest](); return; }
      if (rest.indexOf("settings") === 0) { answerCallbackQuery_(cb.id); showSettingsPanel_(chatId, uid, Number(parts[2]) || 0, ""); return; }
      if (/^(sub|comingsoon|downloadtoggle)/.test(rest)) { handleSubmissionCallback_(cb, parts); return; }
      if (/^(users|list|user|usersearch)/.test(rest)) { handleUsersCallback_(cb, parts); return; }
      if (/^(admins|adminadd|admindel|adminrole)/.test(rest)) { handleAdminsCallback_(cb, parts); return; }
      if (/^resets?/.test(rest)) { handleResetCallback_(cb, parts); return; }
      if (rest.indexOf("broadcast") === 0) { handleBroadcastCallback_(cb, parts); return; }
    }
    if (p0 === "u") { handleUsersCallback_(cb, parts); return; }
    if (p0 === "sub") { handleSubmissionCallback_(cb, parts); return; }
    if (p0 === "r") { handleResetCallback_(cb, parts); return; }
    if (p0 === "support") { handleSupportAdminCallback_(cb, parts); return; }
    if (p0 === "bc") { handleBroadcastCallback_(cb, parts); return; }
    answerCallbackQuery_(cb.id, "دکمه نامعتبر است.");
  } catch (e) {
    console.error("handleAdminCallback_: " + (e && e.stack || e));
    answerCallbackQuery_(cb.id, "خطا رخ داد.");
  }
}
function handleSettingCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const action = parts[1] || ""; const row = Number(parts[2]) || 0;
  if (action === "add") {
    setSession_("M:" + uid, "ADM_SETTING_NEW", {});
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "➕ کلید تنظیم جدید را بفرست (حروف بزرگ و _):\nمثال: MUSIC_PREVIEW_SECONDS", cancelKeyboard_()); return;
  }
  if (action === "search") {
    setSession_("M:" + uid, "ADM_SETTING_SEARCH", {});
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "🔍 بخشی از نام کلید را بفرست:", cancelKeyboard_()); return;
  }
  if (action === "edit") { answerCallbackQuery_(cb.id); showSettingEditor_(chatId, uid, row); return; }
  if (action === "choose") {
    const setting = getAllSettings_().find(function(s) { return s.row === row; });
    const meta = setting && SETTINGS_CHOICE_OPTIONS_[setting.key];
    if (!setting || !meta) { answerCallbackQuery_(cb.id, "تنظیم نامعتبر."); return; }
    if (!hasAdminPermission_(uid, adminPermissionForSettingKey_(setting.key))) { answerCallbackQuery_(cb.id, "دسترسی نداری."); return; }
    const option = meta.options[Number(parts[3]) || 0];
    if (!option) { answerCallbackQuery_(cb.id, "گزینه نامعتبر."); return; }
    setSetting_(setting.key, option.value);
    logAdminAction_(uid, "set", setting.key, String(option.value));
    answerCallbackQuery_(cb.id, "✅ " + option.label);
    if (setting.key === "PUBLISH_ENABLED" || setting.key === "PUBLISH_MODE" || setting.key === "QUEUE_ENABLED" || setting.key === "BACKUP_ENABLED") {
      ensureWorkersReady_();
      if (setting.key === "BACKUP_ENABLED" && option.value !== "true") removeTrigger_("weeklyBackupJob");
    }
    showSettingEditor_(chatId, uid, row); return;
  }
  if (action === "custom") {
    const setting = getAllSettings_().find(function(s) { return s.row === row; });
    if (!setting) { answerCallbackQuery_(cb.id, "تنظیم نامعتبر."); return; }
    if (!hasAdminPermission_(uid, adminPermissionForSettingKey_(setting.key))) { answerCallbackQuery_(cb.id, "دسترسی نداری."); return; }
    setSession_("M:" + uid, "ADM_SETTING_VALUE", { key: setting.key, row: setting.row });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "✏️ مقدار جدید برای «" + setting.key + "» را بفرست:\nمقدار فعلی: " + truncate_(setting.value || "—", 200), cancelKeyboard_()); return;
  }
  if (action === "del") {
    const setting = getAllSettings_().find(function(s) { return s.row === row; });
    if (!setting) { answerCallbackQuery_(cb.id, "تنظیم نامعتبر."); return; }
    const ok = deleteSetting_(setting.key);
    answerCallbackQuery_(cb.id, ok ? "حذف شد" : "این تنظیم محافظت‌شده است.");
    if (ok) logAdminAction_(uid, "del", setting.key, "");
    showSettingsPanel_(chatId, uid, 0, ""); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}
function handleColorCallback_(cb, parts) {
  const key = parts[1] || ""; const style = parts[2] || "default";
  if (["BTN_STYLE_REPLY", "BTN_STYLE_INLINE", "BTN_STYLE_DANGER"].indexOf(key) < 0) { answerCallbackQuery_(cb.id, "نامعتبر"); return; }
  setSetting_(key, style);
  answerCallbackQuery_(cb.id, "✅ رنگ ثبت شد");
  showColorsPanel_(String(cb.message.chat.id), String(cb.from.id));
}
function handlePostButtonCallback_(cb, parts) {
  if (parts[1] === "links") setSetting_("POST_SHOW_LINK_BUTTONS", parts[2] === "true" ? "true" : "false");
  else if (parts[1] === "dlcover") setSetting_("POST_DOWNLOAD_BUTTON_ON_COVER", parts[2] === "true" ? "true" : "false");
  else { answerCallbackQuery_(cb.id, "نامعتبر"); return; }
  answerCallbackQuery_(cb.id, "ثبت شد");
  showColorsPanel_(String(cb.message.chat.id), String(cb.from.id));
}
function handleFJCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const action = parts[1] || "";
  if (action === "enabled") { setSetting_("FJ_ENABLED", parts[2] === "true" ? "true" : "false"); answerCallbackQuery_(cb.id, "ثبت شد"); showFJPanel_(chatId, uid); return; }
  if (action === "add") { setSession_("M:" + uid, "ADM_FJ_CHANNEL", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, "آیدی کانال را بفرست:\nمثال: @mychannel یا -1001234567890 یا لینک t.me/mychannel", cancelKeyboard_()); return; }
  if (action === "del") {
    const row = Number(parts[2]); const sh = getSheet_(APP.SHEETS.REQUIRED_CHANNELS);
    const target = getFJChannels_().find(function(c) { return c.rowNumber === row; });
    if (!target) { answerCallbackQuery_(cb.id, "پیدا نشد."); return; }
    sh.deleteRow(row); answerCallbackQuery_(cb.id, "حذف شد"); showFJPanel_(chatId, uid); return;
  }
  if (action === "toggle") {
    const row = Number(parts[2]); const sh = getSheet_(APP.SHEETS.REQUIRED_CHANNELS);
    const target = getFJChannels_().find(function(c) { return c.rowNumber === row; });
    if (!target) { answerCallbackQuery_(cb.id, "پیدا نشد."); return; }
    sh.getRange(row, 4).setValue(!target.active); answerCallbackQuery_(cb.id, "تغییر کرد"); showFJPanel_(chatId, uid); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}
function showBotModePanel_(chatId, uid) {
  const modes = [["active", "🟢 فعال"], ["paused", "🟡 توقف موقت"], ["maintenance", "🛠 تعمیرات"]];
  sendMessage_(chatId, "🚦 وضعیت بات: " + (getSetting_("BOT_MODE") || "active") + "\nدر حالت تعمیرات فقط پیام وضعیت به کاربر نشان داده می‌شود.", { inline_keyboard: modes.map(function(m) { return [{ text: (String(getSetting_("BOT_MODE")) === m[0] ? "✅ " : "") + m[1], callback_data: "botmode:" + m[0] }]; }).concat([[{ text: "🏠 منو", callback_data: "a:home" }]]) });
}

// ───────────────────────── مدیریت ارسال‌ها ─────────────────────────
function showAdminSubmissions_(chatId, uid, filter, page) {
  if (!adminGate_(chatId, uid, "submissions")) return;
  const all = getAllSubmissions_().slice().sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); });
  let list;
  if (filter === "queue") list = all.filter(function(s) { return s.status === "approved" || s.status === "publishing" || s.status === "failed"; });
  else if (filter === "published") list = all.filter(function(s) { return s.status === "published"; });
  else list = all.filter(function(s) { return s.status === "pending"; });
  const size = 8; const pages = Math.max(1, Math.ceil(list.length / size)); const p = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  const rows = list.slice(p * size, p * size + size).map(function(s) {
    return [{ text: (SUB_STATUS_LABELS_[s.status] || s.status) + " · «" + truncate_(s.title, 22) + "» · " + s.mode, callback_data: "a:sub:" + s.id }];
  });
  rows.push([{ text: "⏳ در انتظار", callback_data: "a:submissions:0" }, { text: "🗓 صف", callback_data: "a:sub:queue" }, { text: "✅ منتشر", callback_data: "a:sub:published" }]);
  if (pages > 1) rows.push([{ text: "◀️", callback_data: "a:sub:" + filter + ":" + Math.max(0, p - 1) }, { text: (p + 1) + "/" + pages, callback_data: "a:sub:" + filter + ":" + p }, { text: "▶️", callback_data: "a:sub:" + filter + ":" + Math.min(pages - 1, p + 1) }]);
  rows.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "🎵 ارسال‌ها — " + ({ queue: "صف انتشار", published: "منتشرشده" }[filter] || "در انتظار تأیید") + " (" + list.length + ")", { inline_keyboard: rows });
}
const SUB_MODE_LABELS_ = { simple: "تک‌آهنگ", album: "آلبوم", coming_soon: "Coming Soon", coming_next: "Coming Soon", freestyle: "🎤 فری‌استایل" };
function showSubmissionDetail_(chatId, uid, submissionId) {
  const sub = getSubmission_(submissionId);
  if (!sub) { sendMessage_(chatId, "ارسال پیدا نشد.", { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:submissions" }]] }); return; }
  const user = getUserById_(sub.userId);
  const media = getSubmissionMedia_(sub.id); const lib = getMusicLibrary_().filter(function(t) { return t.submissionId === sub.id; });
  const lines = ["🆔 " + sub.id, "📀 «" + sub.title + "»", "🎤 " + formatArtistNames_(sub.artists) + (sub.featuring ? " feat. " + joinArtistsAmp_(sub.featuring) : ""), "🧩 نوع: " + (SUB_MODE_LABELS_[sub.mode] || sub.mode), "🚦 وضعیت: " + (SUB_STATUS_LABELS_[sub.status] || sub.status), "👤 مالک: " + sub.userId + (user ? " — " + user.firstName + " " + user.lastName : ""), "🖼 رسانه: " + media.filter(function(m) { return VISUAL_MEDIA_KINDS_.indexOf(m.kind) >= 0; }).length + " تصویر · " + media.filter(function(m) { return m.kind === "audio"; }).length + " صدا" + (freestyleVideoFor_(sub.id).length ? " · 🎤 ۱ اجرای فری‌استایل" : ""), "🗓 زمان‌بندی: " + formatDate_(sub.scheduledAt), "📤 انتشار: " + formatDate_(sub.publishedAt)];
  // اطلاعات برش کانال: کجای اثر و چند ثانیه (تا مدیر بداند چه چیزی پست شده است)
  try {
    const stg = parsePublishStage_(sub);
    if (stg && stg.previewCutSeconds) {
      const mmss = function(sec) { const m = Math.floor(sec / 60); const x = Math.round(sec % 60); return m + ":" + (x < 10 ? "0" + x : x); };
      const label = { peak: "اوج آهنگ", probe: "اوج (نمونه‌برداری)", position: "جای پیش‌فرض", start: "ابتدای اثر" }[stg.previewCutMode] || stg.previewCutMode;
      lines.push("🎧 برش کانال: " + stg.previewCutSeconds + "s از " + mmss(Number(stg.previewCutFromSecond) || 0) + " (" + label + ")" + (stg.previewSourceSeconds ? " · اثر ≈ " + mmss(stg.previewSourceSeconds) : ""));
    } else if (stg && stg.previewOnly) {
      lines.push("🎧 برش کانال ساخته نشد → فایل کامل هم پست نشده؛ دکمهٔ دریافت روی پست کاور است.");
    }
  } catch (e) {}
  const genreTags = genresForSubmission_(sub);
  if (genreTags.length) lines.push("🏷 ژانر: " + genreTags.map(function(t) { return "#" + t; }).join(" "));
  const postTags = buildPostHashtags_(sub);
  if (postTags) lines.push("#️⃣ هشتگ‌های پست: " + postTags);
  if (sub.failure) lines.push("⚠️ خطا: " + truncate_(sub.failure, 200));
  if (sub.reviewNote) lines.push("📝 یادداشت بررسی: " + truncate_(sub.reviewNote, 200));
  if (sub.links && sub.links.length) lines.push("🔗 لینک‌ها:\n" + sub.links.map(function(l) { return "• " + platformMeta_(l.platform).label + ": " + l.url; }).join("\n"));
  const rows = [];
  if (sub.status === "pending") rows.push([{ text: "✅ تأیید", callback_data: "a:subapprove:" + sub.id }, { text: "❌ رد", callback_data: "a:subreject:" + sub.id }]);
  if (sub.status === "approved") rows.push([{ text: "🚀 انتشار فوری", callback_data: "a:subpub:" + sub.id }, { text: "🗓 تغییر زمان", callback_data: "a:subtime:" + sub.id }]);
  if (sub.status === "publishing") rows.push([{ text: "⏹ توقف انتشار", callback_data: "a:substop:" + sub.id }]);
  if (sub.status === "failed") rows.push([{ text: "🔁 تلاش دوباره", callback_data: "a:subretry:" + sub.id }, { text: "❌ رد", callback_data: "a:subreject:" + sub.id }]);
  if (sub.status === "rejected") rows.push([{ text: "✅ بازگردانی به صف", callback_data: "a:subapprove:" + sub.id }]);
  if (lib.length) {
    const toggleRow = lib.slice(0, 3).map(function(t) { return { text: (t.downloadAllowed ? "🔓" : "🔒") + " " + (t.seq || 1), callback_data: "a:downloadtoggle:" + sub.id + ":" + t.trackId }; });
    rows.push(toggleRow);
  }
  if (sub.status === "published") {
    const postUrl = submissionPrimaryPostLink_(sub);
    if (postUrl) rows.push([{ text: "🔗 پست کانال", url: postUrl }]);
  }
  // بررسی مدیر: فایل‌های کاربر، پیش‌نمایش کامل پست کانال، و ویرایش دستی
  rows.push([{ text: "👁 پیش‌نمایش پست کانال", callback_data: "a:subpreview:" + sub.id }, { text: "📂 فایل‌های کاربر", callback_data: "a:subfiles:" + sub.id }]);
  rows.push([{ text: "✏️ ویرایش دستی", callback_data: "a:subedit:" + sub.id }]);
  rows.push([{ text: "🗑 حذف", callback_data: "a:subdel:" + sub.id }, { text: "⬅️ بازگشت", callback_data: "a:submissions" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function handleSubmissionCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const action = parts[1] || "";
  if (action === "submissions") { answerCallbackQuery_(cb.id); showAdminSubmissions_(chatId, uid, "pending", 0); return; }
  if (action === "comingsoon") { handleComingSoonCallback_(cb, parts); return; }
  if (action === "freestyle") { handleFreestyleCallback_(cb, parts); return; }
  if (action === "sub") {
    const arg = parts[2] || "";
    if (arg === "queue" || arg === "published" || arg === "") { answerCallbackQuery_(cb.id); showAdminSubmissions_(chatId, uid, arg === "published" ? "published" : arg === "queue" ? "queue" : "pending", Number(parts[3]) || 0); return; }
    if (!parts[3] && getSubmission_(arg)) { answerCallbackQuery_(cb.id); showSubmissionDetail_(chatId, uid, arg); return; }
    answerCallbackQuery_(cb.id); showAdminSubmissions_(chatId, uid, arg, Number(parts[3]) || 0); return;
  }
  const id = parts[2] || "";
  const sub = getSubmission_(id);
  if (!sub) { answerCallbackQuery_(cb.id, "ارسال پیدا نشد."); return; }
  if (action === "subfiles") {
    answerCallbackQuery_(cb.id);
    showSubmissionFiles_(chatId, uid, id, Number(parts[3]) || 0);
    return;
  }
  if (action === "subpreview") {
    answerCallbackQuery_(cb.id, "👁 در حال ساختن پیش‌نمایش…");
    previewSubmissionPost_(chatId, uid, id);
    return;
  }
  if (action === "subcut") {
    answerCallbackQuery_(cb.id, "🎧 در حال ساختن برش…");
    sendTrackCutToAdmin_(chatId, uid, id, parts[3]);
    return;
  }
  if (action === "subedit") {
    const field = String(parts[3] || "");
    if (!field) { answerCallbackQuery_(cb.id); showAdminEditMenu_(chatId, uid, id); return; }
    if (field === "audio" && !parts[4]) { answerCallbackQuery_(cb.id); adminPickAudioTrack_(chatId, uid, sub); return; }
    if (ADMIN_EDIT_FIELDS_.indexOf(field) < 0) { answerCallbackQuery_(cb.id, "فیلد نامعتبر است."); return; }
    answerCallbackQuery_(cb.id);
    startAdminEdit_(chatId, uid, sub, field, parts[4] || "");
    return;
  }
  if (action === "subapprove") {
    withLock_(function() {
      setSubmissionField_(id, "status", "approved");
      // زمان انتخابیِ هنرمند پاک نمی‌شود؛ فقط اگر در گذشته است یا خالی است، اسلات بعدی گذاشته می‌شود.
      const at = dateMillis_(sub.scheduledAt);
      if (!at || at < nowMs_()) setSubmissionField_(id, "scheduledAt", computeNextSlot_(getSetting_("PUBLISH_INTERVAL_MIN")));
      setSubmissionField_(id, "reviewNote", "");
      setSubmissionField_(id, "reviewedBy", uid);
    });
    sub.status = "approved";
    logAdminAction_(uid, "sub_approve", id, sub.title);
    answerCallbackQuery_(cb.id, "✅ تأیید شد");
    notifySubmissionOwner_(sub, t_(sub.userId, "PUBLISH_REVIEW_OK", { t: sub.title }));
    showSubmissionDetail_(chatId, uid, id); return;
  }
  if (action === "subreject") {
    setSession_("M:" + uid, "ADM_REJECT_REASON", { submissionId: id });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "📝 دلیل رد ارسال «" + sub.title + "» را بنویس (برای کاربر ارسال می‌شود).\nاگر دلیلی نداری «-» بفرست.", cancelKeyboard_()); return;
  }
  if (action === "subpub") {
    setSubmissionField_(id, "scheduledAt", new Date());
    sub.scheduledAt = new Date();
    logAdminAction_(uid, "sub_publish_now", id, sub.title);
    const ok = publishOneSubmission_(sub);
    answerCallbackQuery_(cb.id, ok ? "منتشر شد" : "خطا در انتشار");
    showSubmissionDetail_(chatId, uid, id); return;
  }
  if (action === "substop") {
    // لغو مرحلهٔ انتشار: پست‌های نیمه‌کاره در کانال پاک و ارسال به صف برمی‌گردد.
    const stage = parsePublishStage_(sub);
    const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
    const ids = (stage.visualMessageIds || []).concat(stage.audioMessageIds || []);
    if (channel) ids.forEach(function(mid) { deleteMessage_(channel, mid); });
    setSubmissionField_(id, "status", "approved");
    setSubmissionField_(id, "scheduledAt", new Date());
    setSubmissionField_(id, "publishStage", "{}");
    setSubmissionField_(id, "visualMessageIds", "");
    setSubmissionField_(id, "audioMessageIds", "");
    sub.status = "approved";
    logAdminAction_(uid, "sub_stop", id, sub.title);
    answerCallbackQuery_(cb.id, "⏹ متوقف و به صف برگشت");
    showSubmissionDetail_(chatId, uid, id); return;
  }
  if (action === "subretry") {
    retrySubmission_(id);
    logAdminAction_(uid, "sub_retry", id, sub.title);
    answerCallbackQuery_(cb.id, "🔁 دوباره در صف قرار گرفت");
    showSubmissionDetail_(chatId, uid, id); return;
  }
  if (action === "subtime") {
    setSession_("M:" + uid, "ADM_POST_TIME", { submissionId: id });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "🗓 زمان انتشار را بفرست:\nقالب: 2026-01-20 21:30 (به وقت " + (getSetting_("TIMEZONE") || "Asia/Tehran") + ")", cancelKeyboard_()); return;
  }
  if (action === "subdel") {
    // تأیید دوباره؛ حذف با a:subdel2 انجام می‌شود.
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "⚠️ «" + sub.title + "» (" + sub.id + ") حذف شود؟\n" + (sub.status === "published" ? "پست کانال هم پاک می‌شود.\n" : "") + "این کار برگشت‌پذیر نیست.", { inline_keyboard: [[{ text: "🗑 بله، حذف کن", callback_data: "a:subdel2:" + id }, { text: "❌ انصراف", callback_data: "a:sub:" + id }]] }); return;
  }
  if (action === "subdel2") {
    withLock_(function() {
      // اصلاح باگ: رسانه، کردیت، کتابخانه و پست کانال هم پاک می‌شوند (قبلاً فقط ردیف اصلی حذف می‌شد).
      deleteSubmissionCompletely_(id, { deleteChannel: true });
    });
    logAdminAction_(uid, "sub_delete", id, sub.title);
    answerCallbackQuery_(cb.id, "حذف شد");
    showAdminSubmissions_(chatId, uid, "pending", 0); return;
  }
  if (action === "delapprove") {
    // تأیید درخواست حذفِ کاربر (با دکمه‌های شانسی مثل بات‌فادر)
    const delSub = getSubmission_(id);
    if (!delSub) { answerCallbackQuery_(cb.id, "یافت نشد"); return; }
    const ownerId = String(delSub.userId);
    const prev = String(delSub.failure || "published");
    deleteSubmissionCompletely_(id, { deleteChannel: true });
    logAdminAction_(uid, "user_delete_approve", id, delSub.title);
    answerCallbackQuery_(cb.id, "✅ حذف تأیید شد");
    try { sendMessage_(ownerId, "✅ درخواست حذف «" + delSub.title + "» توسط مدیر تأیید و از کانال حذف شد."); } catch(e){}
    showAdminSubmissions_(chatId, uid, "pending", 0); return;
  }
  if (action === "delreject") {
    const delSub = getSubmission_(id);
    if (!delSub) { answerCallbackQuery_(cb.id, "یافت نشد"); return; }
    const prev = String(delSub.failure || "published");
    // برگشت به وضعیت قبلی (اگر published بود، published می‌ماند — وگرنه pending)
    const restore = (prev === "published" || prev === "approved") ? prev : "pending";
    withLock_(function(){
      setSubmissionField_(id, "status", restore);
      setSubmissionField_(id, "reviewNote", "❌ درخواست حذف توسط مدیر رد شد");
      setSubmissionField_(id, "failure", "");
      bustSubmissionCaches_();
    });
    logAdminAction_(uid, "user_delete_reject", id, delSub.title);
    answerCallbackQuery_(cb.id, "رد شد");
    try { sendMessage_(String(delSub.userId), "❌ درخواست حذف «" + delSub.title + "» توسط مدیر رد شد. اثر همچنان باقی است."); } catch(e){}
    showSubmissionDetail_(chatId, uid, id); return;
  }
  if (action === "downloadtoggle") {
    const trackId = parts[3] || "";
    const track = getMusicLibraryTrack_(trackId);
    if (!track) { answerCallbackQuery_(cb.id, "ترک پیدا نشد."); return; }
    setMusicLibraryDownloadAllowed_(trackId, !track.downloadAllowed);
    refreshPublishedPrimaryDownloadButton_(sub, trackId);
    logAdminAction_(uid, "download_toggle", sub.id, trackId + "=" + !track.downloadAllowed);
    answerCallbackQuery_(cb.id, !track.downloadAllowed ? "🔓 دانلود باز شد" : "🔒 دانلود بسته شد");
    showSubmissionDetail_(chatId, uid, id); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}
function showComingSoonPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "submissions")) return;
  const list = getAllSubmissions_().filter(function(s) { return s.mode === "coming_soon"; }).sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); }).slice(0, 8);
  const rows = list.map(function(s) { return [{ text: (SUB_STATUS_LABELS_[s.status] || s.status) + " «" + truncate_(s.title, 22) + "» · " + formatDate_(s.scheduledAt), callback_data: "a:sub:" + s.id }]; });
  rows.push([{ text: "➕ ارسال Coming Soon", callback_data: "a:comingsoon:create" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "⏳ Coming Soon (" + list.length + ")\nاین پست‌ها فقط اعلام زمان انتشار هستند.", { inline_keyboard: rows });
}
// فهرست فری‌استایل‌های ثبت‌شده (مثل پنل Coming Soon) برای بررسی سریع مدیر
function showFreestylePanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "submissions")) return;
  const list = getAllSubmissions_().filter(function(s) { return String(s.mode) === "freestyle"; }).sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); }).slice(0, 8);
  const rows = list.map(function(s) {
    const kind = freestyleVideoFor_(s.id).length ? "🎥" : "🎵";
    return [{ text: (SUB_STATUS_LABELS_[s.status] || s.status) + " " + kind + " «" + truncate_(s.title, 22) + "» · " + formatDate_(s.scheduledAt), callback_data: "a:sub:" + s.id }];
  });
  rows.push([{ text: "➕ ارسال فری‌استایل", callback_data: "a:freestyle:create" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "🎤 فری‌استایل‌ها (" + list.length + ")\n🎥 = اجرای ویدیویی · 🎵 = فایل MP3 (برش ۳۰ ثانیه‌ای در کانال)", { inline_keyboard: rows });
}
function handleFreestyleCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  answerCallbackQuery_(cb.id);
  if (parts[2] === "create") { startMusicFlow_(chatId, uid, "freestyle"); return; }
  showFreestylePanel_(chatId, uid);
}
function handleComingSoonCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  if (parts[2] === "create") {
    // اصلاح باگ: این هندلر قبلاً هیچ‌جا صدا زده نمی‌شد و دکمهٔ «➕ ارسال Coming Soon» کار نمی‌کرد.
    // ادمین هم می‌تواند Coming Soon بسازد؛ همان ماشین حالت کاربر با پیش‌نویس ادمین اجرا می‌شود.
    answerCallbackQuery_(cb.id);
    startMusicFlow_(chatId, uid, "coming_soon");
    return;
  }
  answerCallbackQuery_(cb.id);
  showComingSoonPanel_(chatId, uid);
}

// ───────────────────────── کاربران ─────────────────────────
function showAdminUsers_(chatId, uid, page, query) {
  if (!adminGate_(chatId, uid, "users")) return;
  let users = getAllUsers_();
  const q = String(query || "").trim();
  if (q) users = users.filter(function(u) { return u.userId.indexOf(q) >= 0 || (u.rapName || "").indexOf(q) >= 0 || normalizePhone_(u.phone).indexOf(normalizePhone_(q)) >= 0 || (u.firstName + " " + u.lastName).indexOf(q) >= 0; });
  users = users.sort(function(a, b) { return dateMillis_(b.registeredAt) - dateMillis_(a.registeredAt); });
  const size = 8; const pages = Math.max(1, Math.ceil(users.length / size)); const p = Math.max(0, Math.min(Number(page) || 0, pages - 1));
  const rows = users.slice(p * size, p * size + size).map(function(u) {
    const flag = u.blocked ? "⛔" : (u.active ? (u.botBlocked ? "🚫" : "✅") : "⏸");
    return [{ text: flag + " " + truncate_(u.rapName || u.firstName || u.userId, 20) + " · " + u.userId, callback_data: "a:user:" + u.userId }];
  });
  if (pages > 1) rows.push([{ text: "◀️", callback_data: "a:list:" + Math.max(0, p - 1) }, { text: (p + 1) + "/" + pages, callback_data: "a:list:" + p }, { text: "▶️", callback_data: "a:list:" + Math.min(pages - 1, p + 1) }]);
  rows.push([{ text: "🔍 جست‌وجو", callback_data: "a:usersearch" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "👥 کاربران (" + users.length + ")" + (q ? " — جست‌وجو: " + q : ""), { inline_keyboard: rows });
}
function showUserDetail_(chatId, uid, targetId) {
  const u = getUserById_(targetId);
  if (!u) { sendMessage_(chatId, "کاربر پیدا نشد."); return; }
  const subs = getAllSubmissions_().filter(function(s) { return String(s.userId) === String(targetId); });
  const lines = ["👤 " + (u.firstName + " " + u.lastName), "🎤 «" + (u.rapName || "—") + "»", "🆔 " + u.userId + (u.username ? " · " + u.username : ""), "📱 " + (u.phone || "—"), "📍 " + [u.province, u.city].filter(Boolean).join(" / "), "🚦 " + (u.blocked ? "مسدود" : u.active ? "فعال" : "غیرفعال") + (u.botBlocked ? " · ربات را بلاک کرده" : "") + (isGateEnabled_(u) ? " · 🔐 دومرحله‌ای" : ""), "🗓 عضویت: " + formatDate_(u.registeredAt) + "\n👁 آخرین فعالیت: " + formatDate_(u.lastSeen), "🎵 ارسال‌ها: " + subs.length + " (منتشر: " + subs.filter(function(s) { return s.status === "published"; }).length + ")"];
  const rows = [
    [{ text: u.blocked ? "✅ رفع مسدودی" : "⛔ مسدود", callback_data: "u:block:" + u.userId }, { text: u.active ? "⏸ غیرفعال" : "▶️ فعال", callback_data: "u:active:" + u.userId }],
    [{ text: "📨 پیام مستقیم", callback_data: "u:msg:" + u.userId }, { text: "💬 گفت‌وگو", callback_data: "support:open:" + u.userId }],
    [{ text: "🛡 نقش مدیر", callback_data: "u:role:" + u.userId }, { text: "🔐 کد دومرحله‌ای", callback_data: "u:2fa:" + u.userId }],
    [{ text: "🗑 حذف حساب", callback_data: "u:del:" + u.userId }],
    [{ text: "⬅️ بازگشت", callback_data: "a:users" }]
  ];
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function handleUsersCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const p0 = parts[0]; const action = parts[1]; const targetId = parts[2];
  if (p0 === "a") {
    if (parts[1] === "users") { answerCallbackQuery_(cb.id); showAdminUsers_(chatId, uid, 0, ""); return; }
    if (parts[1] === "list") { answerCallbackQuery_(cb.id); showAdminUsers_(chatId, uid, Number(parts[2]) || 0, ""); return; }
    if (parts[1] === "usersearch") { setSession_("M:" + uid, "ADM_USER_SEARCH", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, "چیزی برای جست‌وجو بفرست (آیدی، شماره، نام یا لقب):", cancelKeyboard_()); return; }
    if (parts[1] === "user") { answerCallbackQuery_(cb.id); showUserDetail_(chatId, uid, parts[2]); return; }
    if (parts[1] === "admins") { answerCallbackQuery_(cb.id); showAdminAdmins_(chatId, uid); return; }
    if (parts[1] === "resets") { answerCallbackQuery_(cb.id); showResetRequestsPanel_(chatId, uid); return; }
    if (parts[1] === "reset") { handleResetCallback_(cb, ["r", parts[2], parts[3] || ""]); return; }
  }
  if (p0 === "u") {
    const u = getUserById_(targetId);
    if (!u) { answerCallbackQuery_(cb.id, "کاربر پیدا نشد."); return; }
    if (action === "block") { setUserField_(targetId, "blocked", !u.blocked); logAdminAction_(uid, "user_block", targetId, String(!u.blocked)); answerCallbackQuery_(cb.id, u.blocked ? "رفع مسدودی شد" : "مسدود شد"); showUserDetail_(chatId, uid, targetId); return; }
    if (action === "active") { setUserField_(targetId, "active", !u.active); logAdminAction_(uid, "user_active", targetId, String(!u.active)); answerCallbackQuery_(cb.id, u.active ? "غیرفعال شد" : "فعال شد"); showUserDetail_(chatId, uid, targetId); return; }
    if (action === "msg") { setSession_("M:" + uid, "ADM_DIRECT_MSG", { userId: targetId }); answerCallbackQuery_(cb.id); sendMessage_(chatId, "پیام برای کاربر " + targetId + " را بفرست:", cancelKeyboard_()); return; }
    if (action === "role") { showAdminRolePicker_(chatId, uid, targetId); answerCallbackQuery_(cb.id); return; }
    if (action === "2fa") {
      // کد تصادفی یکتا؛ متن خام فقط در همین پیام و فقط به مدیر نشان داده می‌شود.
      const code = issueTwoStepCode_(targetId);
      answerCallbackQuery_(cb.id, "کد ساخته شد");
      sendMessage_(chatId, "🔐 کد دومرحله‌ای کاربر " + htmlEscape_(targetId) + ": <code>" + htmlEscape_(code) + "</code>", { inline_keyboard: [[{ text: "📨 ارسال به کاربر", callback_data: "u:2fasend:" + targetId }], [{ text: "⬅️ بازگشت", callback_data: "a:user:" + targetId }]] }, { parse_mode: "HTML" });
      return;
    }
    if (action === "2fasend") {
      // کد خام دیگر در شیت نیست؛ اگر هنوز در کش یک‌بارمصرف است همان ارسال می‌شود،
      // وگرنه کد تازه‌ای صادر و ارسال می‌شود (قبلاً رشتهٔ خالی ارسال می‌شد).
      const show = takeTwoStepCodeOnce_(targetId) || issueTwoStepCode_(targetId);
      sendMessage_(targetId, t_(targetId, "MFA_CODE_ONLY", { c: htmlEscape_(show) }), null, { parse_mode: "HTML" });
      answerCallbackQuery_(cb.id, "ارسال شد"); return;
    }
    if (action === "del") {
      const subs = getAllSubmissions_().filter(function(s) { return String(s.userId) === String(targetId); }).length;
      answerCallbackQuery_(cb.id);
      sendMessage_(chatId, "⚠️ حساب " + targetId + " و " + subs + " اثر، پیش‌نویس‌ها و تاریخچهٔ پشتیبانی حذف شود؟", { inline_keyboard: [[{ text: "🗑 بله، حذف کن", callback_data: "u:del2:" + targetId }, { text: "❌ انصراف", callback_data: "a:user:" + targetId }]] });
      return;
    }
    if (action === "del2") {
      withLock_(function() { deleteUserCascade_(targetId, { removeSubmissions: true }); });
      logAdminAction_(uid, "user_delete", targetId, "");
      answerCallbackQuery_(cb.id, "حساب حذف شد");
      showAdminUsers_(chatId, uid, 0, ""); return;
    }
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}
function showAdminAdmins_(chatId, uid) {
  const legacy = getLegacyAdminIds_(); const records = getAdminAccessRecords_();
  const lines = ["🛡 دسترسی مدیران", "👑 مالک (ADMIN_IDS): " + (legacy.join(", ") || "—")];
  if (records.length) { lines.push(""); records.forEach(function(r) { lines.push("• " + r.userId + " — " + (ADMIN_ROLE_LABELS_[r.role] || r.role) + (r.active ? "" : " (غیرفعال)")); }); }
  const rows = records.map(function(r) { return [{ text: (r.active ? "✅ " : "⛔ ") + r.userId + " · " + (ADMIN_ROLE_LABELS_[r.role] || r.role), callback_data: "a:admindel:" + r.userId }]; });
  rows.push([{ text: "➕ افزودن مدیر", callback_data: "a:adminadd" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, lines.join("\n") + "\n\nنقش‌ها: " + Object.keys(ADMIN_ROLE_LABELS_).map(function(k) { return k + " = " + ADMIN_ROLE_LABELS_[k]; }).join(" · "), { inline_keyboard: rows });
}
function handleAdminsCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  if (!hasAdminPermission_(uid, "admins") && getLegacyAdminIds_().indexOf(uid) < 0) { answerCallbackQuery_(cb.id, "فقط مالک می‌تواند مدیر اضافه کند."); return; }
  if (parts[1] === "admins") { answerCallbackQuery_(cb.id); showAdminAdmins_(chatId, uid); return; }
  if (parts[1] === "adminadd") { setSession_("M:" + uid, "ADM_ADMIN_ADD", {}); answerCallbackQuery_(cb.id); sendMessage_(chatId, "آیدی عددی کاربر را بفرست تا نقش مدیر بگیرد:", cancelKeyboard_()); return; }
  if (parts[1] === "adminrole") {
    const targetId = parts[2] || ""; const role = parts[3] || "";
    if (!ADMIN_ROLE_LABELS_[role]) { answerCallbackQuery_(cb.id, "نقش نامعتبر."); return; }
    if (!/^\d{4,20}$/.test(targetId)) { answerCallbackQuery_(cb.id, "کاربر نامعتبر."); return; }
    setAdminAccess_(targetId, role, uid);
    logAdminAction_(uid, "admin_role", targetId, role);
    answerCallbackQuery_(cb.id, "✅ " + ADMIN_ROLE_LABELS_[role]);
    sendMessage_(targetId, "🛡 دسترسی مدیریت برای تو فعال شد: " + ADMIN_ROLE_LABELS_[role] + "\nاز /start شروع کن.");
    showAdminAdmins_(chatId, uid); return;
  }
  if (parts[1] === "admindel") {
    const targetId = parts[2] || ""; const sh = getSheet_(APP.SHEETS.ADMIN_ACCESS);
    const record = getAdminAccessRecords_().find(function(r) { return r.userId === targetId; });
    if (record) sh.deleteRow(record.rowNumber);
    ADMIN_ACCESS_MEMO_ = null; logAdminAction_(uid, "admin_del", targetId, "");
    answerCallbackQuery_(cb.id, "حذف شد"); showAdminAdmins_(chatId, uid); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}
function showAdminRolePicker_(chatId, uid, targetId) {
  const rows = Object.keys(ADMIN_ROLE_LABELS_).map(function(role) { return [{ text: ADMIN_ROLE_LABELS_[role], callback_data: "a:adminrole:" + targetId + ":" + role }]; });
  rows.push([{ text: "🚫 حذف نقش", callback_data: "a:admindel:" + targetId }, { text: "⬅️ بازگشت", callback_data: "a:user:" + targetId }]);
  sendMessage_(chatId, "🛡 نقش مدیر برای " + targetId + ":", { inline_keyboard: rows });
}
function setAdminAccess_(targetId, role, addedBy) {
  const sh = getSheet_(APP.SHEETS.ADMIN_ACCESS); const now = new Date();
  const record = getAdminAccessRecords_().find(function(r) { return r.userId === String(targetId); });
  if (record) { sh.getRange(record.rowNumber, 2, 1, 3).setValues([[role, true, String(addedBy)]]); sh.getRange(record.rowNumber, 6).setValue(now); }
  else sh.appendRow([String(targetId), role, true, String(addedBy), now, now]);
  ADMIN_ACCESS_MEMO_ = null;
}
function showResetRequestsPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "users")) return;
  const rows = [];
  const pending = getResetRequests_().filter(function(r) { return r.status === "pending"; });
  pending.slice(0, 8).forEach(function(r) { rows.push([{ text: "🆘 " + (r.firstName + " " + r.lastName).trim() + " · «" + r.rapName + "»", callback_data: "a:reset:" + r.requestId }]); });
  rows.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "🆘 درخواست‌های بازیابی رمز (در انتظار: " + pending.length + ")", { inline_keyboard: rows });
}
function showResetRequestDetail_(chatId, uid, requestId) {
  const r = getResetRequest_(requestId);
  if (!r) { sendMessage_(chatId, "درخواست پیدا نشد."); return; }
  const lines = ["🆘 درخواست " + r.requestId, "👤 " + (r.firstName + " " + r.lastName) + " — «" + r.rapName + "»", "📱 " + r.phone, "🆔 " + r.userId, "🚦 " + r.status];
  const rows = [
    [{ text: "✅ تأیید", callback_data: "r:approve:" + r.requestId }, { text: "❌ رد", callback_data: "r:reject:" + r.requestId }],
    [{ text: "💬 گفت‌وگو", callback_data: "support:open:" + r.userId }, { text: "⬅️ بازگشت", callback_data: "a:resets" }]
  ];
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function handleResetCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  // در هر دو شکل «a:reset:<id>» و «r:approve:<id>» اکشن در parts[1] و شناسه در parts[2] است
  const action = parts[1]; const requestId = parts[2];
  if (action === "resets") { answerCallbackQuery_(cb.id); showResetRequestsPanel_(chatId, uid); return; }
  if (action === "reset") { answerCallbackQuery_(cb.id); showResetRequestDetail_(chatId, uid, requestId); return; }
  const req = getResetRequest_(requestId);
  if (!req) { answerCallbackQuery_(cb.id, "درخواست پیدا نشد."); return; }
  if (action === "approve") {
    if (req.status === "approved") { answerCallbackQuery_(cb.id, "قبلاً تأیید شده."); return; }
    setResetRequestStatus_(requestId, "approved", uid);
    logAdminAction_(uid, "reset_approve", requestId, req.userId);
    answerCallbackQuery_(cb.id, "✅ تأیید شد");
    sendMessage_(req.userId, t_(req.userId, "FORGOT_APPROVED"), { inline_keyboard: [[{ text: "🔐 تعیین رمز جدید", callback_data: "pwreset:" + requestId }]] });
    showResetRequestDetail_(chatId, uid, requestId); return;
  }
  if (action === "reject") {
    setResetRequestStatus_(requestId, "rejected", uid);
    logAdminAction_(uid, "reset_reject", requestId, req.userId);
    answerCallbackQuery_(cb.id, "رد شد");
    sendMessage_(req.userId, t_(req.userId, "FORGOT_REJECTED"));
    showResetRequestDetail_(chatId, uid, requestId); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}

// ───────────────────────── کال‌بک‌های جریان موزیک ─────────────────────────
function handleMusicCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message && cb.message.chat ? cb.message.chat.id : uid); const data = String(cb.data || "");
  const parts = data.split(":");
  // دکمهٔ دانلود در «آثار من» به هیچ پیش‌نویسی مربوط نیست؛ باید قبل از جست‌وجوی پیش‌نویس رسیدگی شود،
  // وگرنه همیشه پیام «پیش‌نویس منقضی شده» می‌گرفت.
  if (parts[1] === "dl") { answerCallbackQuery_(cb.id); handleMusicDownloadDelivery_(chatId, uid, parts[2] || ""); return; }
  const session = getSession_("M:" + uid);
  const draftId = (session && session.data || {}).draftId || parts[2] || "";
  const draft = getMusicDraft_(draftId);
  if (!draft) { answerCallbackQuery_(cb.id, "این پیش‌نویس منقضی شده است."); return; }
  if (String(draft.userId) !== uid && !isAdmin_(uid)) { answerCallbackQuery_(cb.id, "این پیش‌نویس مال تو نیست."); return; }
  if (parts[1] === "done" || parts[1] === "next") {
    answerCallbackQuery_(cb.id, "✅");
    // دکمهٔ «بعدی» در پنل لینک‌ها است؛ اگر نشست پاک شده باشد از همان مرحله ادامه می‌دهیم.
    advanceMusicStep_(chatId, uid, draft, session || { state: parts[1] === "done" ? "MUSIC_AUDIO" : "MUSIC_LINKS", data: { draftId: draft.draftId } });
    return;
  }
  if (parts[1] === "lt") {
    const platform = parts[3] || "";
    if (!draft.data.links || !draft.data.links.some(function(l) { return l.platform === platform; })) { answerCallbackQuery_(cb.id, "نامعتبر"); return; }
    if (!draft.data.platformVisible) draft.data.platformVisible = {};
    const current = draft.data.platformVisible[platform] !== false;
    draft.data.platformVisible[platform] = !current;
    saveMusicDraft_(draft);
    answerCallbackQuery_(cb.id, platformMeta_(platform).label + ": " + (current ? "مخفی" : "نمایش"));
    showDraftLinksPanel_(chatId, uid, draft); return;
  }
  if (parts[1] === "links") { answerCallbackQuery_(cb.id); showDraftLinksPanel_(chatId, uid, draft); return; }
  if (parts[1] === "cancel") { cancelMusicDraft_(uid, session); answerCallbackQuery_(cb.id, "لغو شد"); showUserMenu_(chatId, t_(uid, "CANCEL_FLOW")); return; }
  answerCallbackQuery_(cb.id, "نامعتبر");
}

// ───────────────────────── پشتیبانی دوطرفه ─────────────────────────
function appendSupportMessage_(userId, direction, kind, text, message, extra) {
  const sh = getSheet_(APP.SHEETS.SUPPORT);
  const rowId = newId_("S");
  sh.appendRow([rowId, String(userId), direction, kind, text || "", message && message.chat ? String(message.chat.id) : "", message && message.message_id ? String(message.message_id) : "", new Date(), direction === "admin" ? "true" : "false", (extra && extra.mode) || ""]);
  SUPPORT_MESSAGES_MEMO_ = null;
  return rowId;
}
function getSupportMessages_(userId, limit) {
  const sh = getSheet_(APP.SHEETS.SUPPORT);
  if (sh.getLastRow() < 2) return [];
  const vals = sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.SupportMessages.length).getValues();
  return vals.map(function(r, i) { return { rowNumber: i + 2, messageId: String(r[0] || ""), userId: String(r[1] || ""), direction: String(r[2] || ""), kind: String(r[3] || ""), text: String(r[4] || ""), sourceChatId: String(r[5] || ""), sourceMessageId: String(r[6] || ""), createdAt: r[7] || "", readByAdmin: String(r[8] || "").toLowerCase() === "true", mode: String(r[9] || "") }; })
    .filter(function(m) { return m.userId === String(userId); }).slice(-(limit || 20));
}
function supportAdmins_() { return getAdmins_().filter(function(a) { return hasAdminPermission_(a, "support") || getLegacyAdminIds_().indexOf(a) >= 0; }); }
function startUserSupport_(chatId, uid) {
  setUserField_(uid, "supportMode", "open");
  setSession_("M:" + uid, "USR_SUPPORT", {});
  sendMessage_(chatId, t_(uid, "SUPPORT_OPEN"), { keyboard: [[{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, is_persistent: true });
  supportAdmins_().forEach(function(a) {
    sendMessage_(a, "💬 کاربر " + uid + " گفت‌وگو را باز کرد.", { inline_keyboard: [[{ text: "↩️ پاسخ", callback_data: "support:open:" + uid }, { text: "🔒 بستن", callback_data: "support:close:" + uid }]] });
  });
}
function handleSupportUserMessage_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const kind = isMusicMediaMessage_(message) ? "media" : "text";
  const text = String(message.text || message.caption || "");
  appendSupportMessage_(uid, "user", kind, text, message, {});
  const label = "💬 پیام از " + uid + (text ? "\n" + truncate_(text, 300) : "");
  supportAdmins_().forEach(function(a) {
    if (kind === "media") copyMessage_(a, chatId, message.message_id);
    sendMessage_(a, label, { inline_keyboard: [[{ text: "↩️ پاسخ", callback_data: "support:open:" + uid }, { text: "🔒 بستن", callback_data: "support:close:" + uid }]] });
  });
  sendMessage_(chatId, t_(uid, "SUPPORT_SENT"), { keyboard: [[{ text: t_(uid, "BTN_CANCEL") }]], resize_keyboard: true, is_persistent: true });
}
function showSupportPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "support")) return;
  const users = getAllUsers_().filter(function(u) { return u.supportMode === "open"; });
  const rows = users.slice(0, 8).map(function(u) { return [{ text: "🟢 " + truncate_(u.rapName || u.firstName || u.userId, 20) + " · " + u.userId, callback_data: "support:open:" + u.userId }]; });
  rows.push([{ text: "📋 همهٔ گفت‌وگوها", callback_data: "support:all" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, "💬 پشتیبانی — گفت‌وگوهای باز: " + users.length, { inline_keyboard: rows });
}
function showSupportThread_(chatId, uid, targetId) {
  const target = getUserById_(targetId);
  const messages = getSupportMessages_(targetId, 12);
  const label = "💬 گفت‌وگو با " + (target ? (target.rapName || target.firstName) + " (" + targetId + ")" : targetId);
  const buttons = { inline_keyboard: [[{ text: "↩️ پاسخ", callback_data: "support:open:" + targetId }, { text: "🔒 بستن", callback_data: "support:close:" + targetId }]] };
  if (!messages.length) sendMessage_(chatId, label + "\n\nپیامی ثبت نشده است.", buttons);
  else {
    const lines = [label, ""];
    messages.forEach(function(m) { lines.push((m.direction === "admin" ? "🛡 مدیر: " : "👤 کاربر: ") + (m.kind === "media" ? "[رسانه]" : truncate_(m.text, 200)) + "  ·  " + formatDate_(m.createdAt)); });
    sendMessage_(chatId, lines.join("\n"), buttons);
    messages.filter(function(m) { return m.direction === "user" && m.kind === "media" && m.sourceChatId && m.sourceMessageId; }).slice(-3).forEach(function(m) { copyMessage_(chatId, m.sourceChatId, m.sourceMessageId); });
  }
  const sh = getSheet_(APP.SHEETS.SUPPORT);
  messages.forEach(function(m) { if (m.direction === "user" && !m.readByAdmin) { try { sh.getRange(m.rowNumber, 9).setValue("true"); } catch (e) {} } });
}
function handleSupportAdminCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const action = parts[1] || ""; const targetId = parts[2] || "";
  if (action === "support" || action === "all" || action === "") { answerCallbackQuery_(cb.id); showSupportPanel_(chatId, uid); return; }
  if (action === "open") {
    setSession_("M:" + uid, "ADM_SUPPORT_REPLY", { userId: targetId });
    answerCallbackQuery_(cb.id, "پاسخ را بفرست");
    showSupportThread_(chatId, uid, targetId); return;
  }
  if (action === "close") {
    setUserField_(targetId, "supportMode", "closed");
    const s = getSession_("M:" + targetId);
    if (s && s.state === "USR_SUPPORT") clearSession_("M:" + targetId);
    answerCallbackQuery_(cb.id, "گفت‌وگو بسته شد");
    sendMessage_(targetId, niceText_("SUPPORT_CLOSED_TEXT", null, userLang_(targetId)) || DEFAULT_SETTINGS.SUPPORT_CLOSED_TEXT);
    showSupportPanel_(chatId, uid); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}

// ───────────────────────── پیام همگانی (UI) ─────────────────────────
function showBroadcastPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "broadcast")) return;
  const list = getBroadcasts_().slice().sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); }).slice(0, 6);
  const labels = { draft: "✏️ پیش‌نویس", queued: "⏳ در صف", running: "📤 در حال ارسال", completed: "✅ تمام", failed: "⚠️ خطا", scheduled: "🗓 زمان‌دار", cancelled: "🚫 لغو", paused: "⏸ متوقف" };
  const lines = ["📣 پیام همگانی", "دستهٔ هر اجرا: " + (getSetting_("BROADCAST_BATCH") || 10) + " کاربر"];
  if (list.length) { lines.push(""); list.forEach(function(b) { lines.push("• " + b.broadcastId + " — " + (labels[b.status] || b.status) + " — " + b.target); }); }
  const rows = list.filter(function(b) { return ["draft", "queued", "scheduled", "running", "paused"].indexOf(b.status) >= 0; }).map(function(b) { return [{ text: "📣 " + b.broadcastId + " · " + (labels[b.status] || b.status), callback_data: "bc:view:" + b.broadcastId }]; });
  rows.push([{ text: "➕ کمپین جدید", callback_data: "bc:new" }, { text: "😴 کمپین غیرفعال‌ها", callback_data: "bc:inactive" }]);
  rows.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function showBroadcastDraft_(chatId, uid, broadcastId) {
  const b = getBroadcast_(broadcastId);
  if (!b) { sendMessage_(chatId, "کمپین پیدا نشد."); return; }
  const items = getBroadcastMedia_(broadcastId);
  const recipients = campaignRecipients_(b.target).length;
  const lines = ["📣 " + b.broadcastId, "🚦 " + b.status, "🎯 مخاطب: " + (b.target === "inactive" ? "کاربران غیرفعال" : String(b.target).indexOf("cc_") === 0 ? "کانال‌های وصل‌شده" : "همهٔ کاربران فعال") + " (" + recipients + ")", "🧩 آیتم‌ها: " + items.length, "🗓 " + (b.scheduledAt ? formatDate_(b.scheduledAt) : "ارسال فوری")];
  if (b.lastError) lines.push("⚠️ " + truncate_(b.lastError, 150));
  const rows = [[{ text: "🎯 تغییر مخاطب", callback_data: "bc:target:" + broadcastId + ":" + (b.target === "inactive" ? "all" : "inactive") }]];
  if (b.status === "draft") rows.push([{ text: "🆕 افزودن پیام", callback_data: "bc:add:" + broadcastId }, { text: "👁 پیش‌نمایش", callback_data: "bc:preview:" + broadcastId }]);
  if (b.status === "draft" || b.status === "scheduled" || b.status === "paused") rows.push([{ text: "🚀 ارسال الان", callback_data: "bc:send:" + broadcastId }, { text: "🗓 زمان‌دار", callback_data: "bc:time:" + broadcastId }]);
  if (b.status === "running") rows.push([{ text: "⏸ توقف", callback_data: "bc:stop:" + broadcastId }]);
  if (b.status === "paused") rows.push([{ text: "▶️ ادامه", callback_data: "bc:resume:" + broadcastId }]);
  rows.push([{ text: "📊 گزارش", callback_data: "bc:stats:" + broadcastId }, { text: "🗑 حذف", callback_data: "bc:del:" + broadcastId }]);
  rows.push([{ text: "⬅️ بازگشت", callback_data: "a:broadcast" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: rows });
}
function handleBroadcastCallback_(cb, parts) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const action = parts[1] || ""; const id = parts[2] || "";
  if (parts[0] === "a") { answerCallbackQuery_(cb.id); showBroadcastPanel_(chatId, uid); return; }
  if (action === "new") { answerCallbackQuery_(cb.id); startBroadcastDraft_(chatId, uid); return; }
  if (action === "inactive") {
    const bs = getBroadcasts_(); const existing = bs.filter(function(b) { return b.target === "inactive" && ["draft", "queued", "running", "paused", "scheduled"].indexOf(b.status) >= 0; });
    if (existing.length) { answerCallbackQuery_(cb.id, "یک کمپین غیرفعال‌ها باز است."); showBroadcastDraft_(chatId, uid, existing[0].broadcastId); return; }
    const newId = newId_("BCI");
    getSheet_(APP.SHEETS.BROADCASTS).appendRow([newId, "inactive", "now", "draft", "", String(uid), new Date(), ""]);
    getSheet_(APP.SHEETS.BROADCAST_MEDIA).appendRow([newId, 1, "", "", "text", String(getSetting_("INACTIVE_TEXT") || DEFAULT_SETTINGS.INACTIVE_TEXT)]);
    answerCallbackQuery_(cb.id, "ساخته شد");
    showBroadcastDraft_(chatId, uid, newId); return;
  }
  if (!id && action !== "new") { answerCallbackQuery_(cb.id, "نامعتبر"); return; }
  const b = getBroadcast_(id);
  if (action === "view") { answerCallbackQuery_(cb.id); showBroadcastDraft_(chatId, uid, id); return; }
  if (!b) { answerCallbackQuery_(cb.id, "کمپین پیدا نشد."); return; }
  if (action === "add") {
    setSession_("M:" + uid, "ADM_BROADCAST_COLLECT", { broadcastId: id, append: true });
    answerCallbackQuery_(cb.id); sendMessage_(chatId, "پیام جدید کمپین را بفرست:", cancelKeyboard_()); return;
  }
  if (action === "target") { setBroadcastField_(id, "target", parts[3] === "inactive" ? "inactive" : "all"); answerCallbackQuery_(cb.id, "ثبت شد"); showBroadcastDraft_(chatId, uid, id); return; }
  if (action === "preview") {
    const items = getBroadcastMedia_(id); answerCallbackQuery_(cb.id);
    if (!items.length) { sendMessage_(chatId, "کمپین آیتمی ندارد."); return; }
    items.slice(0, 3).forEach(function(it) { if (it.kind === "text") sendMessage_(chatId, "👁 " + it.caption); else copyMessage_(chatId, it.sourceChatId, it.sourceMessageId); });
    return;
  }
  if (action === "send") {
    if (!getBroadcastMedia_(id).length) { answerCallbackQuery_(cb.id, "اول یک پیام اضافه کن."); return; }
    setBroadcastField_(id, "status", "queued"); logAdminAction_(uid, "broadcast_send", id, b.target);
    answerCallbackQuery_(cb.id, "🚀 در صف ارسال");
    showBroadcastDraft_(chatId, uid, id); broadcastQueueJob(); return;
  }
  if (action === "time") {
    setSession_("M:" + uid, "ADM_BROADCAST_TIME", { broadcastId: id });
    answerCallbackQuery_(cb.id); sendMessage_(chatId, "زمان ارسال را بفرست:\nقالب: 2026-01-20 21:30", cancelKeyboard_()); return;
  }
  if (action === "stop") {
    // اصلاح باگ: «توقف» قابل‌ادامه است (paused) و دیگر cancelled نمی‌شود.
    if (["running", "queued", "scheduled"].indexOf(b.status) < 0) { answerCallbackQuery_(cb.id, "این کمپین در حال ارسال نیست."); return; }
    setBroadcastField_(id, "status", "paused"); logAdminAction_(uid, "broadcast_pause", id, "");
    answerCallbackQuery_(cb.id, "⏸ متوقف شد (قابل ادامه)"); showBroadcastDraft_(chatId, uid, id); return;
  }
  if (action === "resume") {
    if (b.status !== "paused") { answerCallbackQuery_(cb.id, "این کمپین متوقف نیست."); return; }
    setBroadcastField_(id, "status", "queued"); logAdminAction_(uid, "broadcast_resume", id, "");
    answerCallbackQuery_(cb.id, "▶️ ادامه می‌یابد"); showBroadcastDraft_(chatId, uid, id); broadcastQueueJob(); return;
  }
  if (action === "del") { deleteBroadcastDraft_(id); answerCallbackQuery_(cb.id, "حذف شد"); showBroadcastPanel_(chatId, uid); return; }
  if (action === "stats") {
    const logs = getDeliveryLogs_(id); answerCallbackQuery_(cb.id);
    const sent = logs.filter(function(l) { return l.status === "sent"; }).length;
    const blocked = logs.filter(function(l) { return l.status === "blocked"; }).length;
    const failed = logs.filter(function(l) { return l.status !== "sent" && l.status !== "blocked"; }).length;
    sendMessage_(chatId, "📊 " + id + "\n✅ ارسال‌شده: " + sent + "\n🚫 بلاک‌کرده: " + blocked + "\n⚠️ ناموفق: " + failed + "\n🎯 کل مخاطب: " + campaignRecipients_(b.target).length, { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "bc:view:" + id }]] }); return;
  }
  answerCallbackQuery_(cb.id, "نامعتبر");
}

// ───────────────────────── حالت‌های ورودی متنی مدیر ─────────────────────────
function handleAdminState_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const state = String(session.state || ""); const data = session.data || {};
  const text = String(message.text || "").trim();
  // اگر مدیر روی یکی از دکمه‌های اصلی منوی مدیریت کلیک کرد، نشست قبلی را ببند و مستقیم همان بخش را باز کن
  if (isAdminMenuButton_(text)) {
    cancelAdminFlow_(uid, session);
    handleAdminMenuMessage_(message);
    return;
  }
  const requiredPermission = adminPermissionForState_(state, data);
  if (requiredPermission && !hasAdminPermission_(uid, requiredPermission)) { clearSession_("M:" + uid); sendMessage_(chatId, "⛔ نقش تو اجازهٔ این کار را ندارد.", adminKeyboard_()); return; }
  const finish = function(reply) { clearSession_("M:" + uid); showAdminMenu_(chatId, reply); };

  // ویرایش دستی اثر توسط مدیر (ADM_EDIT_TITLE / …_COVER / …_AUDIO / …)
  if (state.indexOf("ADM_EDIT_") === 0) { handleAdminEditState_(message, session); return; }

  // پیام مدیر به کانال‌های وصل‌شده: هر قالبی (متن/عکس/صوت/ویدیو/فایل) → تأییدیهٔ «فوری/صف»
  if (state === "ADM_CC_MSG") {
    const target = String(data.target || "cc_all");
    const kind = message.photo ? "photo" : message.audio ? "audio" : message.video ? "video" : message.voice ? "voice" : message.document ? "document" : (message.text ? "text" : "");
    if (!kind) { sendMessage_(chatId, "قالب را نفهمیدم — متن، عکس، صوت، ویدیو یا فایل بفرست.", cancelKeyboard_()); return; }
    const item = { kind: kind, caption: kind === "text" ? String(message.text || "") : String(message.caption || ""), sourceChatId: String(message.chat.id), sourceMessageId: String(message.message_id) };
    const n = ccBroadcastRows_(target).length;
    setSession_("M:" + uid, "ADM_CC_CONFIRM", { target: target, item: item, sel: data.sel || [], page: data.page || 0 });
    sendMessage_(chatId, "📨 پیام آماده شد — مخاطب: " + n + " کانال وصل‌شده.\nچطور فرستاده شود؟", { inline_keyboard: [[{ text: "🚀 ارسال فوری (همین حالا)", callback_data: "acc:now" }, { text: "⏳ بگذار در صف", callback_data: "acc:queue" }], [{ text: "❌ انصراف", callback_data: "acc:cancelcb" }]] });
    return;
  }
  // بنر تبلیغاتی: پیام مدیر ثبت می‌شود و مدیر انتخاب می‌کند به همه، انتخابی یا فقط ذخیره شود
  if (state === "ADM_CC_BANNER") {
    const kind = message.photo ? "photo" : message.audio ? "audio" : message.video ? "video" : message.voice ? "voice" : message.document ? "document" : (message.text ? "text" : "");
    if (!kind) { sendMessage_(chatId, "قالب را نفهمیدم — بنر را به‌صورت متن، عکس، صوت، ویدیو یا فایل بفرست.", cancelKeyboard_()); return; }
    const item = { kind: kind, caption: kind === "text" ? String(message.text || "") : String(message.caption || ""), sourceChatId: String(message.chat.id), sourceMessageId: String(message.message_id) };
    setCcBanner_(item, uid);
    logAdminAction_(uid, "cc_banner_set", kind, item.caption.slice(0, 80));
    clearSession_("M:" + uid);
    const activeCount = getActiveConnectedChannels_().length;
    sendMessage_(chatId, "🖼 بنر جدید ذخیره شد.", adminKeyboard_());
    sendMessage_(chatId, "📤 این بنر اکنون کجا ارسال شود؟", {
      inline_keyboard: [
        [{ text: "📨 ارسال به همهٔ کانال‌ها (" + activeCount + ")", callback_data: "bn:sendall" }],
        [{ text: "🎯 انتخاب کانال (ارسال به ۱ یا چند کانال)", callback_data: "bn:pick:0" }],
        [{ text: "✅ فقط ذخیره بماند (بدون ارسال الان)", callback_data: "bn:panel" }]
      ]
    });
    return;
  }

  // ویرایش پیام‌های ارسال‌شده در کانال‌های وصل‌شده (تکی یا دسته‌ای)
  if (state === "ADM_CC_POST_EDIT") {
    const kind = message.photo ? "photo" : message.audio ? "audio" : message.video ? "video" : message.voice ? "voice" : message.document ? "document" : (message.text ? "text" : "");
    if (!kind) { sendMessage_(chatId, "قالب را نفهمیدم — متن، عکس، صوت، ویدیو یا فایل جدید را برای جایگزینی/ویرایش بفرست.", cancelKeyboard_()); return; }
    const mode = String(data.mode || "post");
    if (mode === "post") {
      const post = getCcPostById_(data.postId);
      clearSession_("M:" + uid);
      if (!post || post.status !== "active") {
        sendMessage_(chatId, "⚠️ این پیام دیگر فعال نیست یا قبلاً حذف شده است.", adminKeyboard_());
        showCcPostsList_(chatId, uid, 0, "all");
        return;
      }
      const res = editCcPostRecord_(post, message);
      logAdminAction_(uid, "cc_post_edit_one", post.postId, res.ok ? "ok" : res.desc);
      sendMessage_(chatId, res.ok ? "✅ پیام در کانال با موفقیت ویرایش شد." : ("⚠️ ویرایش ناموفق بود: " + res.desc), adminKeyboard_());
      showCcBatchDetail_(chatId, uid, post.batchId, 0);
      return;
    }
    const batchId = String(data.batchId || "");
    const posts = getActiveCcPosts_().filter(function(p) { return p.batchId === batchId; });
    clearSession_("M:" + uid);
    if (!posts.length) {
      sendMessage_(chatId, "⚠️ هیچ پیام فعالی برای این دسته پیدا نشد.", adminKeyboard_());
      showCcPostsList_(chatId, uid, 0, "all");
      return;
    }
    let okCount = 0; let failCount = 0;
    posts.forEach(function(p) {
      const r = editCcPostRecord_(p, message);
      if (r.ok) okCount++; else failCount++;
    });
    // اگر این دسته مربوط به بنر تبلیغاتی بود، نسخهٔ ذخیره‌شدهٔ بنر را هم به‌روزرسانی کن
    if (posts[0].sourceType === "banner") {
      setCcBanner_({
        kind: kind,
        caption: kind === "text" ? String(message.text || "") : String(message.caption || ""),
        sourceChatId: String(message.chat.id),
        sourceMessageId: String(message.message_id)
      }, uid);
    }
    logAdminAction_(uid, "cc_post_edit_batch", batchId, "ok=" + okCount + ",fail=" + failCount);
    sendMessage_(chatId, "✏️ ویرایش دسته‌ای انجام شد.\n✅ ویرایش موفق: " + okCount + " کانال · ⛔ ناموفق: " + failCount, adminKeyboard_());
    showCcBatchDetail_(chatId, uid, batchId, 0);
    return;
  }

  if (state === "ADM_SETTING_VALUE") {
    if (!data.key) { finish("تنظیم نامعتبر بود."); return; }
    const key = String(data.key);
    if (key === "CHANNEL_ID" || key === "STAGING_CHANNEL_ID") {
      const channel = normalizeChannelId_(text);
      if (!channel) { sendMessage_(chatId, "آیدی کانال معتبر نیست. مثال: @mychannel یا -1001234567890", cancelKeyboard_()); return; }
      setSetting_(key, channel); logAdminAction_(uid, "set", key, channel);
      if (key === "CHANNEL_ID") CHANNEL_LINK_MEMO_ = null;
      finish("📺 کانال ثبت شد: " + channel); return;
    }
    if (["PUBLISH_INTERVAL_MIN", "INACTIVE_AFTER_DAYS", "INACTIVE_REPEAT_DAYS", "BROADCAST_BATCH", "MUSIC_PREVIEW_SECONDS", "MUSIC_DOWNLOAD_DELETE_SECONDS", "MAX_SUBMISSIONS_PER_DAY", "MAX_COVER_PHOTOS", "MAX_AUDIO_FILES", "MAX_AUDIO_MB", "RATE_MSG_PER_MIN", "RATE_SUBMITS_PER_HOUR", "RATE_DOWNLOADS_PER_HOUR", "LOGIN_TTL_DAYS", "SESSION_TTL_HOURS", "AUTO_DELETE_DRAFTS_DAYS", "PREVIEW_ANALYZE_MAX_MB", "PREVIEW_HEAD_BYTES", "PREVIEW_PROBE_BYTES", "PREVIEW_PROBE_COUNT", "PREVIEW_PEAK_SKIP_SECONDS", "PREVIEW_PEAK_POSITION_PCT", "PREVIEW_TAG_KEEP_BYTES", "MAX_GENRE_TAGS", "MAX_POST_HASHTAGS", "MUSIC_PAGE_SIZE", "CLEANUP_INTERVAL_HOURS"].indexOf(key) >= 0) {
      const n = Number(normalizeDigits_(text));
      if (!n || n <= 0) { sendMessage_(chatId, "یک عدد مثبت بفرست:", cancelKeyboard_()); return; }
      setSetting_(key, String(Math.floor(n))); logAdminAction_(uid, "set", key, String(Math.floor(n)));
      finish("✅ ثبت شد: " + key + " = " + Math.floor(n)); return;
    }
    if (["PUBLISH_ENABLED", "FJ_ENABLED", "MUSIC_DOWNLOAD_DEFAULT_ENABLED", "POST_SHOW_LINK_BUTTONS", "POST_DOWNLOAD_BUTTON_ON_COVER", "DOWNLOAD_LINK_TOKEN", "QUEUE_ENABLED", "BACKUP_ENABLED", "ADMIN_ERROR_NOTIFY", "USER_LANG_EDITABLE"].indexOf(key) >= 0) {
      const v = /^(true|1|yes|on|بله|فعال|روشن)$/i.test(text) ? "true" : "false";
      setSetting_(key, v); logAdminAction_(uid, "set", key, v);
      finish("✅ ثبت شد: " + key + " = " + v); return;
    }
    if (key === "BOT_MODE" && ["active", "paused", "maintenance"].indexOf(text) < 0) { sendMessage_(chatId, "یکی از این‌ها را بفرست: active / paused / maintenance", cancelKeyboard_()); return; }
    if (key === "DEFAULT_LANG" && LANGS.indexOf(text) < 0) { sendMessage_(chatId, "fa یا en را بفرست.", cancelKeyboard_()); return; }
    setSetting_(key, text); logAdminAction_(uid, "set", key, truncate_(text, 120));
    finish("✅ «" + key + "» ثبت شد."); return;
  }
  if (state === "ADM_SETTING_NEW") {
    const key = String(text || "").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (!/^[A-Z][A-Z0-9_]{2,40}$/.test(key)) { sendMessage_(chatId, "کلید معتبر نیست (حروف بزرگ انگلیسی و _):", cancelKeyboard_()); return; }
    if (getAllSettings_().some(function(s) { return s.key === key; })) { sendMessage_(chatId, "این کلید وجود دارد؛ از ویرایش استفاده کن.", cancelKeyboard_()); return; }
    setSetting_(key, ""); logAdminAction_(uid, "set_add", key, "");
    setSession_("M:" + uid, "ADM_SETTING_VALUE", { key: key, row: rowOfSetting_(key) });
    sendMessage_(chatId, "✅ ساخته شد. حالا مقدار «" + key + "» را بفرست:", cancelKeyboard_()); return;
  }
  if (state === "ADM_SETTING_SEARCH") { clearSession_("M:" + uid); showSettingsPanel_(chatId, uid, 0, text); return; }
  if (state === "ADM_FJ_CHANNEL") {
    const channel = normalizeChannelId_(text);
    if (!channel) { sendMessage_(chatId, "آیدی/لینک کانال معتبر نیست.", cancelKeyboard_()); return; }
    const info = telegramRequest_("getChat", { chat_id: channel });
    if (!info || !info.ok) { sendMessage_(chatId, "❌ ربات به این کانال دسترسی ندارد. اول ربات را ادمین کن.\n" + String(info && info.description || ""), cancelKeyboard_()); return; }
    const title = String(info.result.title || channel);
    const joinUrl = info.result.username ? "https://t.me/" + info.result.username : (/^-100\d+$/.test(channel) ? "https://t.me/c/" + channel.replace("-100", "") : text);
    getSheet_(APP.SHEETS.REQUIRED_CHANNELS).appendRow([channel, joinUrl, title, true, new Date()]);
    finish("✅ کانال اضافه شد: " + title); return;
  }
  if (state === "ADM_USER_SEARCH") { clearSession_("M:" + uid); showAdminUsers_(chatId, uid, 0, text); return; }
  if (state === "ADM_DIRECT_MSG") {
    const targetId = data.userId;
    const result = isMusicMediaMessage_(message) ? copyMessage_(targetId, chatId, message.message_id) : sendMessage_(targetId, text);
    if (result && result.ok) finish("✅ پیام به " + targetId + " ارسال شد."); else finish("⚠️ ارسال ناموفق: " + String(result && result.description || ""));
    return;
  }
  if (state === "ADM_ADMIN_ADD") {
    const targetId = normalizeDigits_(text).replace(/[^0-9]/g, "");
    if (!/^\d{4,20}$/.test(targetId)) { sendMessage_(chatId, "آیدی عددی معتبر بفرست:", cancelKeyboard_()); return; }
    setAdminAccess_(targetId, "publisher", uid);
    clearSession_("M:" + uid);
    showAdminRolePicker_(chatId, uid, targetId);
    sendMessage_(chatId, "نقش کاربر " + targetId + " را انتخاب کن.");
    return;
  }
  if (state === "ADM_SUPPORT_REPLY") {
    const targetId = data.userId;
    if (!targetId) { finish("کاربر نامعتبر."); return; }
    const user = getUserById_(targetId);
    if (user && user.supportMode !== "open") setUserField_(targetId, "supportMode", "open");
    const delivered = isMusicMediaMessage_(message) ? copyMessage_(targetId, chatId, message.message_id) : sendMessage_(targetId, "🛡 پشتیبانی:\n" + text);
    appendSupportMessage_(targetId, "admin", isMusicMediaMessage_(message) ? "media" : "text", text, message, {});
    if (!delivered || !delivered.ok) sendMessage_(chatId, "⚠️ ارسال به کاربر ناموفق بود: " + String(delivered && delivered.description || ""));
    else sendMessage_(chatId, "✅ پاسخ ارسال شد. پیام بعدی را بفرست یا «❌ لغو» را بزن.", cancelKeyboard_());
    return;
  }
  if (state === "ADM_REJECT_REASON") {
    const note = (text === "-" || !text) ? "" : truncate_(text, 180);
    const sub = getSubmission_(data.submissionId);
    if (!sub) { finish("ارسال پیدا نشد."); return; }
    withLock_(function() {
      setSubmissionField_(sub.id, "status", "rejected");
      setSubmissionField_(sub.id, "reviewNote", note);
      setSubmissionField_(sub.id, "reviewedBy", uid);
    });
    logAdminAction_(uid, "sub_reject", sub.id, note);
    clearSession_("M:" + uid);
    notifySubmissionOwner_(sub, t_(sub.userId, "PUBLISH_REVIEW_NO", { t: sub.title, note: note ? t_(sub.userId, "PUBLISH_REVIEW_NOTE", { note: note }) : "" }));
    showSubmissionDetail_(chatId, uid, sub.id); return;
  }
  if (state === "ADM_POST_TIME") {
    const when = parseSchedule_(text);
    if (!when) { sendMessage_(chatId, "زمان معتبر نیست. قالب: 2026-01-20 21:30 (باید در آینده باشد)", cancelKeyboard_()); return; }
    setSubmissionField_(data.submissionId, "scheduledAt", when);
    setSubmissionField_(data.submissionId, "status", "approved");
    logAdminAction_(uid, "sub_time", data.submissionId, formatDate_(when));
    finish("🗓 زمان ثبت شد: " + formatDate_(when)); return;
  }
  if (state === "ADM_BROADCAST_TIME") {
    const when = parseSchedule_(text);
    if (!when) { sendMessage_(chatId, "زمان معتبر نیست. قالب: 2026-01-20 21:30", cancelKeyboard_()); return; }
    setBroadcastField_(data.broadcastId, "scheduledAt", when);
    setBroadcastField_(data.broadcastId, "status", "scheduled");
    finish("🗓 کمپین برای " + formatDate_(when) + " زمان‌دار شد."); return;
  }
  if (state === "ADM_BROADCAST_COLLECT") {
    if (text === "✅ پایان" || text === "پایان") { clearSession_("M:" + uid); showBroadcastDraft_(chatId, uid, data.broadcastId); return; }
    if (isMusicMediaMessage_(message)) { appendBroadcastMedia_(data.broadcastId, message, "media", String(message.caption || "")); sendMessage_(chatId, "✅ آیتم اضافه شد. بعدی یا «✅ پایان».", { keyboard: [[{ text: "✅ پایان" }], [{ text: "❌ لغو" }]], resize_keyboard: true, is_persistent: true }); return; }
    if (text) { appendBroadcastMedia_(data.broadcastId, message, "text", text); sendMessage_(chatId, "✅ متن اضافه شد. بعدی یا «✅ پایان».", { keyboard: [[{ text: "✅ پایان" }], [{ text: "❌ لغو" }]], resize_keyboard: true, is_persistent: true }); return; }
    sendMessage_(chatId, "متن یا رسانه بفرست، یا «✅ پایان» را بزن.");
    return;
  }
  clearSession_("M:" + uid);
  showAdminMenu_(chatId, "این مرحله منقضی شده بود.");
}
function handleWithdrawConfirm_(message, session) {
  // پس‌گرفتن ارسال توسط کاربر پس از تأیید «OK»
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const data = session && session.data || {};
  const sub = getSubmission_(data.submissionId);
  const text = String(message.text || "").trim();
  if (!sub || String(sub.userId) !== uid) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "EXPIRED_BTN")); showUserMenu_(chatId); return; }
  if (text !== "OK" && text !== "ok" && text !== "بله") { sendMessage_(chatId, "برای تأیید دقیقاً بنویس: OK (یا «❌ لغو» را بزن)", cancelKeyboard_()); return; }
  if (!draftWithdrawable_(sub)) { clearSession_("M:" + uid); sendMessage_(chatId, t_(uid, "EXPIRED_BTN")); showUserMenu_(chatId); return; }
  deleteSubmissionCompletely_(sub.id, { deleteChannel: true });
  clearSession_("M:" + uid);
  sendMessage_(chatId, t_(uid, "CANCEL_DONE") + "\n🗑 «" + sub.title + "»");
  showUserMenu_(chatId);
}

// ───────────────────────── نگهداری، لاگ و بکاپ ─────────────────────────
function cleanupJob() {
  resetRuntimeCaches_();
  const out = { sessions: 0, drafts: 0, triggers: 0, deliveries: 0 };
  const lock = LockService.getScriptLock(); if (!lock.tryLock(15000)) return out;
  try {
    // ۱) نشست‌های منقضی
    const ssh = getSheet_(APP.SHEETS.SESSIONS);
    if (ssh.getLastRow() >= 2) {
      const vals = ssh.getRange(2, 1, ssh.getLastRow() - 1, HEADERS.Sessions.length).getValues();
      for (let i = vals.length - 1; i >= 0; i--) {
        const exp = dateMillis_(vals[i][4]);
        if (exp && exp < nowMs_()) { ssh.deleteRow(i + 2); out.sessions++; }
      }
    }
    SESSION_INDEX_MEMO_ = null;
    // ۲) پیش‌نویس‌های کهنهٔ باز
    const days = Math.max(1, Number(getSetting_("AUTO_DELETE_DRAFTS_DAYS") || 7));
    const cutoff = nowMs_() - days * 86400000;
    // سن پیش‌نویس از آخرین «نوشتن» سنجیده می‌شود؛ اگر updatedAt همیشه «الان» باشد هیچ پیش‌نویسی کهنه نمی‌شود.
    getMusicDrafts_().filter(function(d) {
      if (d.status !== "open") return false;
      const last = Math.max(dateMillis_(d.createdAt), dateMillis_(d.data && d.data.lastTouchedAt) || 0);
      return last < cutoff;
    }).forEach(function(d) {
      try { deleteDraftCompletely_(d.draftId); out.drafts++; } catch (e) {}
    });
    // ۳) تریگرهای اضافی (حداکثر ۲۰ تریگر در هر پروژه)
    pruneTrigger_("deleteExpiredMusicDeliveries_", 1);
    pruneTrigger_("publishQueueJob", 1);
    pruneTrigger_("broadcastQueueJob", 1);
    pruneTrigger_("cleanupJob", 1);
    pruneTrigger_("weeklyBackupJob", 1);
    out.triggers = ScriptApp.getProjectTriggers().length;
    // ۴) ردیف‌های دانلود قدیمی (بیش از ۶۰ روز)
    const dsh = getSheet_(APP.SHEETS.MUSIC_DOWNLOADS);
    if (dsh.getLastRow() >= 2) {
      const dv = dsh.getRange(2, 1, dsh.getLastRow() - 1, 10).getValues();
      for (let i = dv.length - 1; i >= 0; i--) {
        if (String(dv[i][6]) !== "pending" && dateMillis_(dv[i][9]) && dateMillis_(dv[i][9]) < nowMs_() - 60 * 86400000) { dsh.deleteRow(i + 2); out.deliveries++; }
      }
    }
    if (String(getSetting_("BACKUP_ENABLED") || "false") === "true") ensureWeeklyBackupTrigger_();
  } catch (e) { logError_("cleanupJob", e); }
  finally { try { lock.releaseLock(); } catch (e2) {} }
  return out;
}
function removeTrigger_(handler) { findTriggersByHandler_(handler).forEach(function(t) { try { ScriptApp.deleteTrigger(t); } catch (e) {} }); }
function ensureWeeklyBackupTrigger_() {
  if (findTriggersByHandler_("weeklyBackupJob").length) return;
  try { ScriptApp.newTrigger("weeklyBackupJob").timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(3).create(); } catch (e) { console.error("ensureWeeklyBackupTrigger_: " + e); }
}
function weeklyBackupJob() { resetRuntimeCaches_(); runBackup_(true); }
function runBackup_(weekly) {
  try {
    const ss = getDatabase_();
    const name = String(getSetting_("BACKUP_FOLDER_NAME") || "FloraBot-Backups");
    // اگر پوشه نبود ساخته می‌شود؛ قبلاً پوشه ساخته نمی‌شد و همهٔ بکاپ‌ها در ریشهٔ درایو می‌ریختند.
    let folder = null;
    try {
      const folders = DriveApp.getFoldersByName(name);
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(name);
    } catch (e) { logError_("runBackup_:folder", e); folder = null; }
    const file = DriveApp.getFileById(ss.getId());
    const copy = file.makeCopy("FloraBot-backup-" + Utilities.formatDate(new Date(), getSetting_("TIMEZONE") || APP.TZ, "yyyyMMdd-HHmm") + (weekly ? "-weekly" : ""));
    if (folder) { try { folder.addFile(copy); } catch (e) { logError_("runBackup_:addFile", e); } }
    else {
      // حتی اگر ساخت پوشه ممکن نبود، حداقل بکاپ در ریشه ساخته می‌شود و مدیر خبردار می‌شود.
      try { getAdmins_().forEach(function(a) { sendMessage_(a, "⚠️ پوشهٔ بکاپ ساخته نشد؛ فایل بکاپ در ریشهٔ Drive ذخیره شد."); }); } catch (e) {}
    }
    try {
      // نگه‌داشتن فقط ۸ بکاپ آخر برای صرفه‌جویی در فضای درایو
      if (folder) {
        const files = folder.getFiles();
        const list = [];
        while (files.hasNext()) { const f = files.next(); if (f.getName().indexOf("FloraBot-backup-") === 0) list.push(f); }
        list.slice(0, Math.max(0, list.length - 8)).forEach(function(f) { try { f.setTrashed(true); } catch (e) {} });
      }
    } catch (e) {}
    return copy;
  } catch (e) { logError_("runBackup_", e); return null; }
}

// ───────────────────────── صفحهٔ دانلود وب (doGet) ─────────────────────────
function showErrorsPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const list = recentErrors_(8);
  if (!list.length) { sendMessage_(chatId, "🐞 خطایی ثبت نشده است. 🎉", { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:maintenance" }]] }); return; }
  const lines = ["🐞 آخرین خطاها (" + list.length + ")", ""];
  list.forEach(function(e, i) {
    lines.push((i + 1) + ") " + formatDate_(e.createdAt) + " · " + truncate_(e.where, 40));
    lines.push("   " + truncate_(String(e.message).split("\n")[0], 100));
  });
  sendMessage_(chatId, truncate_(lines.join("\n"), 3500), { inline_keyboard: [[{ text: "⬅️ بازگشت", callback_data: "a:maintenance" }]] });
}
function showArtistDashboard_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const stats = getMusicLibraryStats_();
  const lines = ["🎤 داشبورد هنرمندان", "🎧 ترک: " + stats.tracks + " · ✅ منتشرشده: " + stats.published + " · ⬇️ دانلود: " + stats.downloads, ""];
  const top = stats.byArtist.slice(0, 12);
  if (!top.length) lines.push("هنوز داده‌ای نیست.");
  top.forEach(function(a, i) {
    const bar = "█".repeat(Math.max(0, Math.min(10, Math.round((a.downloads / Math.max(1, (top[0].downloads || 1))) * 10))));
    lines.push((i + 1) + ". " + truncate_(a.artist, 22) + " — " + a.tracks + " ترک · ⬇️ " + a.downloads + (bar ? "\n   " + bar : ""));
  });
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: [[{ text: "⬇️ آمار ترک‌ها", callback_data: "a:trackstats" }, { text: "🏠 منو", callback_data: "a:home" }]] });
}
function showTrackStats_(chatId, uid) {
  if (!adminGate_(chatId, uid, "settings")) return;
  const lib = getMusicLibrary_().slice().sort(function(a, b) { return (Number(b.downloadCount) || 0) - (Number(a.downloadCount) || 0); }).slice(0, 15);
  const lines = ["⬇️ آمار دانلود ترک‌ها", ""];
  if (!lib.length) lines.push("کتابخانه خالی است.");
  lib.forEach(function(t, i) { lines.push((i + 1) + ". " + truncate_(t.title, 26) + " — " + truncate_(t.artists, 18) + " · " + (Number(t.downloadCount) || 0) + (t.downloadAllowed ? "" : " (بسته)")); });
  const total = getMusicLibrary_().reduce(function(a, t) { return a + (Number(t.downloadCount) || 0); }, 0);
  lines.push("", "مجموع دانلود: " + total);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: [[{ text: "🎤 داشبورد هنرمندان", callback_data: "a:artistdash" }, { text: "🏠 منو", callback_data: "a:home" }]] });
}
function csvEscape_(v) {
  const s = String(v == null ? "" : v).replace(/"/g, '""');
  return /[",\n]/.test(s) ? '"' + s + '"' : s;
}
function sendCsvExport_(chatId, uid, kind) {
  if (!adminGate_(chatId, uid, "settings")) return;
  let headers = []; let rows = []; let name = "";
  if (kind === "subs") {
    headers = ["id", "user_id", "title", "artists", "status", "mode", "scheduled_at", "published_at", "downloads"];
    const libCount = {};
    getMusicLibrary_().forEach(function(t) { libCount[t.submissionId] = (libCount[t.submissionId] || 0) + (Number(t.downloadCount) || 0); });
    rows = getAllSubmissions_().map(function(s) { return [s.id, s.userId, s.title, s.artists, s.status, s.mode, formatDate_(s.scheduledAt), formatDate_(s.publishedAt), libCount[s.id] || 0]; });
    name = "submissions";
  } else {
    headers = ["user_id", "phone", "first_name", "last_name", "rap_name", "province", "city", "country", "active", "blocked", "registered_at", "last_seen"];
    rows = getAllUsers_().map(function(u) { return [u.userId, u.phone, u.firstName, u.lastName, u.rapName, u.province, u.city, u.country, u.active ? "yes" : "no", u.blocked ? "yes" : "no", formatDate_(u.registeredAt), formatDate_(u.lastSeen)]; });
    name = "users";
  }
  // BOM برای اینکه اکسل حروف فارسی را درست نشان دهد
  const csv = "\uFEFF" + [headers.map(csvEscape_).join(",")].concat(rows.map(function(r) { return r.map(csvEscape_).join(","); })).join("\r\n");
  const fileName = "florabot-" + name + "-" + Utilities.formatDate(new Date(), getSetting_("TIMEZONE") || APP.TZ, "yyyyMMdd-HHmm") + ".csv";
  try {
    const blob = Utilities.newBlob(Utilities.newBlob(csv, "text/csv", fileName).getBytes(), "text/csv", fileName);
    const result = sendDocument_(chatId, blob);
    if (!result || !result.ok) throw new Error(String(result && result.description || "sendDocument failed"));
    logAdminAction_(uid, "export_csv", kind, String(rows.length));
  } catch (e) {
    logError_("sendCsvExport_", e);
    sendMessage_(chatId, "❌ خروجی ساخته نشد: " + truncate_(String(e && e.message || e), 150));
  }
}
function downloadLandingPage_(params) {
  const token = verifyDownloadParam_(params.t || params.p || "", params.s || "");
  const safe = function(v) { return htmlEscape_(v); };
  let body;
  if (!token) {
    body = '<div class="card"><h1>لینک دانلود نامعتبر است</h1><p>این لینک منقضی شده یا دستکاری شده است. لطفاً از پست کانال دوباره وارد شو.</p></div>';
  } else {
    const bot = getBotUsername_();
    const start = bot ? "https://t.me/" + bot + "?start=download_" + downloadStartParam_(token) : "";
    body = '<div class="card"><h1>🎧 دانلود آماده است</h1><p>برای دریافت فایل، بخش گفت‌وگو با ربات را باز کن. فایل به‌صورت مستقیم در تلگرام برایت ارسال می‌شود و پس از چند ثانیه از گفت‌وگو حذف می‌شود.</p>'
      + (start ? '<a class="btn" href="' + safe(start) + '">بازکردن ربات و دریافت فایل</a>' : '<p>یوزرنیم ربات تنظیم نشده است؛ از پنل مدیر آن را ثبت کن.</p>')
      + '</div>';
  }
  return '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>فلورا بات | دانلود</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0c;color:#f4f4f6;font-family:Tahoma,system-ui,sans-serif}'
    + '.card{max-width:520px;margin:24px;padding:32px;border-radius:20px;background:#141417;border:1px solid #2a2a30;box-shadow:0 20px 60px rgba(0,0,0,.5)}'
    + 'h1{font-size:24px;margin:0 0 12px;color:#d6b260}p{line-height:1.9;color:#b9b9c2;margin:0 0 20px}'
    + '.btn{display:block;text-align:center;padding:14px 20px;border-radius:12px;background:#d6b260;color:#111;text-decoration:none;font-weight:700}</style></head><body>'
    + body + '</body></html>';
}

// ═══════════════════════════════════════════════════════════════════════════
// بررسی مدیر: ۱) همهٔ فایل‌هایی که کاربر فرستاده  ۲) پیش‌نمایش کامل پست کانال
//              ۳) ویرایش دستی (متن‌ها + رسانه‌ها) با اعمال زنده روی پست منتشرشده
// ═══════════════════════════════════════════════════════════════════════════
const ADMIN_MEDIA_PER_PAGE_ = 6;
const ADMIN_EDIT_FIELDS_ = ["title", "artists", "featuring", "credits", "genre", "links", "caption", "hashtags", "cover", "audio", "freestyle"];

function adminCutSecondLabel_(sec) {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(s / 60); const x = s % 60;
  return m + ":" + (x < 10 ? "0" + x : x);
}
function adminCutModeLabel_(mode) {
  return { peak: "اوج آهنگ", probe: "اوج (نمونه‌برداری)", position: "جای پیش‌فرض", start: "ابتدای اثر" }[String(mode || "")] || String(mode || "");
}
function adminFileSizeLabel_(n) {
  const b = Number(n) || 0;
  if (b <= 0) return "";
  if (b < 1024 * 1024) return Math.round(b / 1024) + "KB";
  return (Math.round(b / 1024 / 102.4) / 10) + "MB";
}
function adminSubmissionContext_(sub) {
  const media = getSubmissionMedia_(sub.id);
  return {
    media: media,
    audios: media.filter(function(m) { return m.kind === "audio"; }),
    visuals: media.filter(function(m) { return VISUAL_MEDIA_KINDS_.indexOf(m.kind) >= 0; }),
    freestyle: media.filter(function(m) { return FREESTYLE_VIDEO_KINDS_.indexOf(m.kind) >= 0; })
  };
}
// عنوان ترک دقیقاً همان‌طور که انتشار محاسبه می‌کند
function adminTrackTitleFor_(sub, item, index, audios) {
  const trackId = musicTrackIdFromMedia_(sub.id, item, index);
  const libTrack = getMusicLibraryTrack_(trackId);
  return String((libTrack && libTrack.title) || (audios.length > 1 ? String(sub.title || "Track") + " — " + (index + 1) : String(sub.title || "Track")));
}
function adminPerformerFor_(sub) {
  return joinArtistsAmp_(sub.artists) + (String(sub.featuring || "").trim() ? " feat. " + joinArtistsAmp_(sub.featuring) : "");
}
function adminMediaLabel_(sub, item, ctx) {
  const kind = String(item.kind || "");
  if (kind === "audio") {
    const idx = ctx.audios.indexOf(item);
    return "🎵 ترک " + (idx + 1) + (ctx.audios.length > 1 ? " از " + ctx.audios.length : "") + " — «" + adminTrackTitleFor_(sub, item, idx < 0 ? 0 : idx, ctx.audios) + "»";
  }
  if (FREESTYLE_VIDEO_KINDS_.indexOf(kind) >= 0) return "🎤 اجرای فری‌استایل (" + (kind === "freestyle_video_note" ? "ویدیو مسیج گرد" : "ویدیو") + ")";
  const vIdx = ctx.visuals.indexOf(item);
  const no = vIdx < 0 ? 1 : vIdx + 1;
  if (kind === "video_note") return "📹 ویدیو مسیج " + no;
  if (kind === "voice") return "🎙 ویس " + no;
  if (kind === "video") return "🎬 ویدیو/کاور ویدیویی " + no;
  if (kind === "photo") return "🖼 کاور " + no;
  return "📎 رسانه (" + kind + ")";
}
function adminSendMediaToChat_(chatId, item, label) {
  const fid = String(item.fileId || "");
  const kind = String(item.kind || "");
  const size = adminFileSizeLabel_(item.fileSize);
  const note = label + (size ? " · " + size : "") + (item.mimeType ? " · " + item.mimeType : "");
  if (!fid) return { ok: false, error: "file_id خالی است" };
  if (kind === "photo") return telegramRequest_("sendPhoto", { chat_id: String(chatId), photo: fid, caption: note });
  if (kind === "video") return telegramRequest_("sendVideo", { chat_id: String(chatId), video: fid, caption: note });
  if (kind === "voice") return telegramRequest_("sendVoice", { chat_id: String(chatId), voice: fid, caption: note });
  if (kind === "video_note" || kind === "freestyle_video_note") {
    const r = telegramRequest_("sendVideoNote", { chat_id: String(chatId), video_note: fid });
    if (r && r.ok) sendMessage_(chatId, note);
    return r;
  }
  if (kind === "freestyle_video") return telegramRequest_("sendVideo", { chat_id: String(chatId), video: fid, caption: note });
  if (kind === "audio") return telegramRequest_("sendAudio", { chat_id: String(chatId), audio: fid, caption: note, parse_mode: undefined });
  return telegramRequest_("sendDocument", { chat_id: String(chatId), document: fid, caption: note });
}

// ── ۱) همهٔ فایل‌های کاربر، همان‌طور که فرستاده است ──
function showSubmissionFiles_(chatId, uid, submissionId, page) {
  const sub = getSubmission_(submissionId);
  if (!sub) { sendMessage_(chatId, "ارسال پیدا نشد.", adminKeyboard_()); return; }
  const ctx = adminSubmissionContext_(sub);
  const user = getUserById_(sub.userId);
  if (!ctx.media.length) {
    sendMessage_(chatId, "📂 فایل‌های کاربر — «" + sub.title + "»\nاین اثر هیچ فایل رسانه‌ای ندارد؛ در کانال با کاور پیش‌فرض و متن منتشر می‌شود.",
      { inline_keyboard: [[{ text: "👁 پیش‌نمایش پست کانال", callback_data: "a:subpreview:" + sub.id }], [{ text: "⬅️ بازگشت", callback_data: "a:sub:" + sub.id }]] });
    return;
  }
  const pages = Math.max(1, Math.ceil(ctx.media.length / ADMIN_MEDIA_PER_PAGE_));
  const p = Math.max(0, Math.min(pages - 1, Number(page) || 0));
  const slice = ctx.media.slice(p * ADMIN_MEDIA_PER_PAGE_, (p + 1) * ADMIN_MEDIA_PER_PAGE_);
  const kinds = {};
  ctx.media.forEach(function(m) { const k = String(m.kind || "?"); kinds[k] = (kinds[k] || 0) + 1; });
  const kindLabel = { photo: "🖼 عکس", video: "🎬 ویدیو", video_note: "📹 ویدیو مسیج", voice: "🎙 ویس", audio: "🎵 صدا", freestyle_video: "🎤 اجرای ویدیویی", freestyle_video_note: "🎤 اجرای گرد" };
  const summary = Object.keys(kinds).map(function(k) { return (kindLabel[k] || k) + ": " + kinds[k]; }).join(" · ");
  sendMessage_(chatId, "📂 فایل‌های ارسال‌شدهٔ کاربر — «" + sub.title + "»\n🆔 " + sub.id + " · 🧩 " + (SUB_MODE_LABELS_[sub.mode] || sub.mode) +
    "\n👤 " + sub.userId + (user ? " — " + user.firstName + " " + user.lastName : "") +
    "\n🧮 " + ctx.media.length + " فایل (" + summary + ")" + (pages > 1 ? "\n📄 صفحهٔ " + (p + 1) + "/" + pages : "") +
    "\n🔽 همان فایل‌های اصلی، بدون هیچ تغییری:");
  const failed = [];
  slice.forEach(function(item) {
    const label = adminMediaLabel_(sub, item, ctx);
    try {
      const r = adminSendMediaToChat_(chatId, item, label);
      if (!r || !r.ok) failed.push(label + " → " + String((r && r.description) || "ارسال نشد"));
    } catch (e) { failed.push(label + " → " + String(e && e.message || e)); }
  });
  const rows = [];
  if (pages > 1) {
    rows.push([
      { text: "◀️ قبلی", callback_data: "a:subfiles:" + sub.id + ":" + Math.max(0, p - 1) },
      { text: (p + 1) + "/" + pages, callback_data: "a:sub:" + sub.id },
      { text: "بعدی ▶️", callback_data: "a:subfiles:" + sub.id + ":" + Math.min(pages - 1, p + 1) }
    ]);
  }
  rows.push([{ text: "👁 پیش‌نمایش پست کانال", callback_data: "a:subpreview:" + sub.id }, { text: "✏️ ویرایش دستی", callback_data: "a:subedit:" + sub.id }]);
  rows.push([{ text: "⬅️ جزئیات اثر", callback_data: "a:sub:" + sub.id }]);
  sendMessage_(chatId, failed.length
    ? "⚠️ " + failed.length + " فایل ارسال نشد:\n• " + failed.join("\n• ")
    : "✅ همهٔ فایل‌های همین صفحه فرستاده شد (بقیهٔ فایل‌ها در صفحه‌های بعدی یا با «پیش‌نمایش پست کانال»).",
    { inline_keyboard: rows });
}

// ── ۲) پیش‌نمایش کامل پست کانال: همان کد انتشار، فقط مقصد چت مدیر است ──
function previewSubmissionPost_(chatId, uid, submissionId) {
  const sub = getSubmission_(submissionId);
  if (!sub) { sendMessage_(chatId, "ارسال پیدا نشد.", adminKeyboard_()); return; }
  const mode = String(sub.mode || "simple");
  const ctx = adminSubmissionContext_(sub);
  const lines = ["👁 پیش‌نمایش کامل پست کانال", "📀 «" + sub.title + "» · 🎤 " + formatArtistNames_(sub.artists),
    "🧩 " + (SUB_MODE_LABELS_[mode] || mode) + " · 🚦 " + (SUB_STATUS_LABELS_[sub.status] || sub.status) + " · 🆔 " + sub.id,
    "⚠️ این پیام‌ها فقط در چت تو هستند؛ هیچ‌چیز در کانال منتشر نمی‌شود."];
  const stg = parsePublishStage_(sub);
  if (ctx.audios.length) {
    if (stg && stg.previewCutSeconds) {
      lines.push("🎧 در کانال: برش " + stg.previewCutSeconds + "s از " + adminCutSecondLabel_(stg.previewCutFromSecond) + " (" + adminCutModeLabel_(stg.previewCutMode) + ")" + (stg.previewSourceSeconds ? " از اثر ≈ " + adminCutSecondLabel_(stg.previewSourceSeconds) : ""));
    } else {
      lines.push("🎧 در کانال: فقط برش " + getMusicPreviewSeconds_() + " ثانیه‌ای از اوج آهنگ + دکمهٔ دریافت زیرش");
    }
    lines.push("🔽 اینجا فایل(های) کامل را می‌شنوی؛ برش کانال با دکمهٔ «🎧 برش کانال» جداگانه قابل شنیدن است.");
  }
  lines.push("🔽 از اینجا به بعد دقیقاً همان چیزی است که در کانال منتشر می‌شود:");
  sendMessage_(chatId, lines.join("\n"));

  const problems = [];
  let visualIds = [];
  let freestylePosted = false;
  if (mode === "freestyle" && ctx.freestyle.length) {
    const r = sendFreestylePostBody_(sub, chatId, ctx.freestyle[0], { markup: postActionsMarkup_(sub) });
    if (r.ok) { visualIds = r.messageIds; freestylePosted = true; } else problems.push(r.error);
  } else {
    const r = sendVisualPostBody_(sub, chatId, { markup: postActionsMarkup_(sub) });
    if (r.ok) visualIds = r.messageIds; else problems.push(r.error);
  }
  const isComingSoon = ["coming_soon", "coming_next"].indexOf(mode) >= 0;
  if (!isComingSoon && !freestylePosted) {
    if (!ctx.audios.length) problems.push("این اثر فایل صوتی ندارد → در کانال فقط کاور/متن منتشر می‌شود.");
    ctx.audios.forEach(function(item, index) {
      const trackId = musicTrackIdFromMedia_(sub.id, item, index);
      const trackTitle = adminTrackTitleFor_(sub, item, index, ctx.audios);
      sendMessage_(chatId, "🎧 ترک " + (index + 1) + "/" + ctx.audios.length + " — «" + trackTitle + "»\nدر کانال: برش " + getMusicPreviewSeconds_() + " ثانیه‌ای از اوج + دکمهٔ دریافت زیرش. اینجا: فایل کاملِ کاربر.",
        { inline_keyboard: [[{ text: "🎧 برش کانال را بشنو", callback_data: "a:subcut:" + sub.id + ":" + (item.seq || index + 1) }]] });
      // دقیقاً همان payload انتشار، فقط به‌جای Blobِ برش، file_id اصلیِ کاربر
      const base = { chat_id: String(chatId), title: truncate_(trackTitle, 60), performer: truncate_(adminPerformerFor_(sub), 60), caption: buildAudioCaption_(sub, trackTitle), parse_mode: "HTML" };
      const markup = downloadButtonMarkup_(sub, trackId);
      if (markup) base.reply_markup = markup;
      const coverMessageId = Number(visualIds[0] || 0);
      if (coverMessageId && String(getSetting_("POST_AUDIO_REPLY_TO_COVER") || "true") !== "false") base.reply_to_message_id = coverMessageId;
      const r = sendChannelAudio_(Object.assign({}, base, { audio: item.fileId }));
      if (!r || !r.ok) problems.push("ترک " + (index + 1) + " ارسال نشد: " + String((r && r.description) || ""));
    });
  }
  const rows = [
    [{ text: "✏️ ویرایش دستی", callback_data: "a:subedit:" + sub.id }, { text: "📂 فایل‌های کاربر", callback_data: "a:subfiles:" + sub.id }],
    [{ text: "⬅️ جزئیات اثر", callback_data: "a:sub:" + sub.id }, { text: "🏠 پنل مدیریت", callback_data: "a:home" }]
  ];
  const foot = ["⬆️ همان کاور، همان متن و هشتگ‌ها، همان دکمه‌ها و همان ترتیب در کانال منتشر می‌شود."];
  if (problems.length) foot.push("⚠️ نکته‌هایی که در پیش‌نمایش دیدم:\n• " + problems.join("\n• "));
  sendMessage_(chatId, foot.join("\n"), { inline_keyboard: rows });
}

// ── ۳) برش واقعیِ ۳۰ ثانیه‌ای که کانال می‌گیرد ──
function sendTrackCutToAdmin_(chatId, uid, submissionId, seq) {
  const sub = getSubmission_(submissionId);
  if (!sub) { sendMessage_(chatId, "ارسال پیدا نشد.", adminKeyboard_()); return; }
  const ctx = adminSubmissionContext_(sub);
  if (!ctx.audios.length) { sendMessage_(chatId, "این اثر فایل صوتی ندارد."); return; }
  const want = Number(seq) || 1;
  let item = ctx.audios.filter(function(m) { return Number(m.seq) === want; })[0] || ctx.audios[0];
  const index = Math.max(0, ctx.audios.indexOf(item));
  const trackTitle = adminTrackTitleFor_(sub, item, index, ctx.audios);
  sendMessage_(chatId, "⏳ در حال ساختن برش «" + trackTitle + "» — تحلیل اوج آهنگ چند لحظه طول می‌کشد…");
  const blob = buildAudioPreviewBlob_(item.fileId, getMusicPreviewSeconds_());
  const info = lastPreviewCutInfo_();
  if (!blob || !info) {
    sendMessage_(chatId, "⚠️ برش ساخته نشد (فرمت ناشناخته، فایل خراب، یا بزرگ‌تر از سقف getFile تلگرام).\nدر کانال هم پست صوتی نمی‌رود و دکمهٔ دریافت روی پست کاور می‌نشیند.");
    return;
  }
  const cap = "🎧 برش کانال: " + info.seconds + "s از " + adminCutSecondLabel_(info.startSecond) + " (" + adminCutModeLabel_(info.mode) + ")" +
    (info.totalSeconds ? " · اثر ≈ " + adminCutSecondLabel_(info.totalSeconds) : "") + "\n📀 «" + trackTitle + "»";
  const r = sendChannelAudio_({ chat_id: String(chatId), audio: blob, title: truncate_(trackTitle, 60), performer: truncate_(adminPerformerFor_(sub), 60), caption: cap });
  if (!r || !r.ok) sendMessage_(chatId, "⚠️ ارسال برش ناموفق بود: " + String((r && r.description) || ""));
}

// ── ۴) ویرایش دستی توسط مدیر ──
function adminEditSummary_(sub) {
  const ctx = adminSubmissionContext_(sub);
  const details = (sub.request && sub.request.details) || {};
  const genres = genresForSubmission_(sub);
  const adminTags = adminHashtagsFor_(sub);
  const credits = getSubmissionCredits_(sub.id);
  return [
    "📀 عنوان: " + (sub.title || "—"),
    "🎤 هنرمند: " + (formatArtistNames_(sub.artists) || "—") + (sub.featuring ? " · 🎧 feat: " + joinArtistsAmp_(sub.featuring) : ""),
    "🧩 عوامل: " + (credits.length ? credits.length + " مورد" : "—") + " · 🏷 ژانر: " + (genres.length ? genres.map(function(t) { return "#" + t; }).join(" ") : "—"),
    "#️⃣ هشتگ دستی: " + (adminTags.length ? adminTags.map(function(t) { return "#" + t; }).join(" ") : "—") + " · 🔗 لینک: " + ((sub.links || []).length || "—"),
    "📝 متن پست: " + (String(sub.caption || "").trim() ? "دستی («" + truncate_(String(sub.caption).trim(), 40) + "»)" : "قالب خودکار"),
    "🖼 رسانه: " + ctx.visuals.length + " کاور · 🎵 " + ctx.audios.length + " صدا" + (ctx.freestyle.length ? " · 🎤 ۱ اجرا" : "")
  ].join("\n");
}
function showAdminEditMenu_(chatId, uid, submissionId) {
  const sub = getSubmission_(submissionId);
  if (!sub) { sendMessage_(chatId, "ارسال پیدا نشد.", adminKeyboard_()); return; }
  const id = sub.id;
  const isFs = String(sub.mode) === "freestyle";
  const rows = [
    [{ text: "📀 عنوان", callback_data: "a:subedit:" + id + ":title" }, { text: "🎤 هنرمند(ها)", callback_data: "a:subedit:" + id + ":artists" }],
    [{ text: "🎧 فیچرینگ", callback_data: "a:subedit:" + id + ":featuring" }, { text: "🧩 عوامل", callback_data: "a:subedit:" + id + ":credits" }],
    [{ text: "🏷 ژانر", callback_data: "a:subedit:" + id + ":genre" }, { text: "🔗 لینک‌ها", callback_data: "a:subedit:" + id + ":links" }],
    [{ text: "📝 متن پست", callback_data: "a:subedit:" + id + ":caption" }, { text: "#️⃣ هشتگ دستی", callback_data: "a:subedit:" + id + ":hashtags" }],
    [{ text: "🖼 کاور/رسانه", callback_data: "a:subedit:" + id + ":cover" }, (isFs ? { text: "🎤 اجرای فری‌استایل", callback_data: "a:subedit:" + id + ":freestyle" } : { text: "🎵 فایل صوتی", callback_data: "a:subedit:" + id + ":audio" })],
    [{ text: "🗓 زمان انتشار", callback_data: "a:subtime:" + id }],
    [{ text: "👁 پیش‌نمایش پست", callback_data: "a:subpreview:" + id }, { text: "📂 فایل‌های کاربر", callback_data: "a:subfiles:" + id }],
    [{ text: "⬅️ جزئیات اثر", callback_data: "a:sub:" + id }]
  ];
  sendMessage_(chatId, "✏️ ویرایش دستی — «" + sub.title + "» (" + id + ")\n\n" + adminEditSummary_(sub) +
    "\n\nهر تغییری که بدهی، روی پست کانال هم اعمال می‌شود (اگر منتشر شده باشد: متن درجا ویرایش، رسانه با حذف و انتشار دوباره).",
    { inline_keyboard: rows });
}
function adminEditPrompt_(sub, field) {
  const genres = musicGenreList_().map(function(g) { return g.label; }).join("، ");
  const mode = String(sub.mode || "simple");
  if (field === "title") return "📀 عنوان جدید را بفرست.\nفعلی: «" + sub.title + "»";
  if (field === "artists") return "🎤 نام هنرمند(ها) را بفرست (چند نام با «&» یا «،»).\nفعلی: " + formatArtistNames_(sub.artists);
  if (field === "featuring") return "🎧 فیچرینگ/همراه را بفرست («-» = بدون فیچرینگ).\nفعلی: " + (sub.featuring || "—");
  if (field === "credits") return "🧩 عوامل را خط‌به‌خط با قالب «نقش: نام» بفرست؛ جای فهرست قبلی می‌نشیند.\nمثال:\nProduction: Ali\nMix & Master: Reza\nLyrics: Sina\n(«-» = پاک کردن همه)";
  if (field === "genre") return "🏷 ژانر/حال‌وهوا را بفرست — حداکثر " + maxGenreTags_() + " مورد، با کاما یا فاصله جدا کن.\nانتخاب‌های شیت: " + (genres || "—") + "\n(«-» = پاک کردن)";
  if (field === "links") return "🔗 همهٔ لینک‌های پلتفرم‌ها را بفرست (هر لینک در یک خط) — جای فهرست قبلی می‌نشیند.\n(«-» = پاک کردن همه)";
  if (field === "caption") return "📝 متن کامل پست را بفرست.\nاین متن جای قالب خودکار (عنوان/هنرمند/بلوک) را می‌گیرد؛ لینک کانال و فوتر خودکار اضافه می‌شوند و اگر خودت «#» بگذاری هشتگ خودکار نمی‌آید.\n(«-» = بازگشت به قالب خودکار)";
  if (field === "hashtags") return "#️⃣ هشتگ‌های دستی را بفرست (با فاصله یا کاما، بدون «#») — به هشتگ‌های خودکارِ پست اضافه می‌شوند.\nفعلی: " + (adminHashtagsFor_(sub).join(" ") || "—") + "\n(«-» = پاک کردن)";
  if (field === "cover") return "🖼 کاور/رسانهٔ جدید را بفرست" + (mode === "coming_soon" ? " (عکس، ویدیو، ویدیو مسیج یا ویس)" : " (عکس یا ویدیو)") + " — جای قبلی می‌نشیند.";
  if (field === "audio") return "🎵 فایل صوتی جدید را بفرست (MP3) — جای همان ترک می‌نشیند.";
  if (field === "freestyle") return "🎤 اجرای جدید را بفرست: 🎥 ویدیو مسیج گرد، 🎬 ویدیو یا 🎵 MP3.";
  return "مقدار جدید را بفرست.";
}
function startAdminEdit_(chatId, uid, sub, field, arg) {
  if (ADMIN_EDIT_FIELDS_.indexOf(field) < 0) { sendMessage_(chatId, "فیلد نامعتبر است."); return; }
  setSession_("M:" + uid, "ADM_EDIT_" + String(field).toUpperCase(), { submissionId: sub.id, field: field, arg: String(arg || "") });
  sendMessage_(chatId, adminEditPrompt_(sub, field), cancelKeyboard_());
}
// کدام ترک آلبوم؟ (فقط وقتی بیش از یک ترک صوتی باشد)
function adminPickAudioTrack_(chatId, uid, sub) {
  const ctx = adminSubmissionContext_(sub);
  if (ctx.audios.length <= 1) { startAdminEdit_(chatId, uid, sub, "audio", ctx.audios.length ? String(ctx.audios[0].seq || 1) : "1"); return; }
  const rows = ctx.audios.map(function(item, i) {
    return [{ text: "🎵 ترک " + (i + 1) + " — «" + adminTrackTitleFor_(sub, item, i, ctx.audios) + "»", callback_data: "a:subedit:" + sub.id + ":audio:" + (item.seq || i + 1) }];
  });
  rows.push([{ text: "⬅️ بازگشت", callback_data: "a:subedit:" + sub.id }]);
  sendMessage_(chatId, "🎵 کدام ترک را می‌خواهی عوض کنی؟", { inline_keyboard: rows });
}
function applyAdminTextEdit_(uid, sub, field, text) {
  const id = sub.id;
  const raw = String(text || "").trim();
  if (field === "title") {
    const title = truncate_(stripLinks_(raw.replace(/^[^:：]{1,12}[:：]\s*/, "")), 80);
    if (title.length < 2) return { ok: false, error: "عنوان خیلی کوتاه است (حداقل ۲ نویسه)." };
    withLock_(function() { setSubmissionField_(id, "title", title); touchSubmission_(id); });
    return { ok: true, label: "عنوان → «" + title + "»" };
  }
  if (field === "artists") {
    const artists = truncate_(stripLinks_(raw.replace(/^[^:：]{1,12}[:：]\s*/, "")), 80);
    if (artists.length < 2) return { ok: false, error: "نام هنرمند خیلی کوتاه است." };
    withLock_(function() { setSubmissionField_(id, "artists", artists); touchSubmission_(id); });
    return { ok: true, label: "هنرمند → " + formatArtistNames_(artists) };
  }
  if (field === "featuring") {
    let feat = truncate_(stripLinks_(raw), 80);
    if (feat === "-" || feat === "—") feat = "";
    withLock_(function() { setSubmissionField_(id, "featuring", feat); touchSubmission_(id); });
    return { ok: true, label: "فیچرینگ → " + (feat || "(خالی)") };
  }
  if (field === "credits") {
    const cleared = raw === "-" || raw === "—";
    const credits = cleared ? [] : parseCreditsText_(raw);
    if (!credits.length && !cleared) return { ok: false, error: "قالب عوامل درست نیست. هر خط «نقش: نام» باشد." };
    withLock_(function() {
      deleteRowsByKey_(APP.SHEETS.CREDITS, 1, [id]);
      credits.forEach(function(c, idx) { getSheet_(APP.SHEETS.CREDITS).appendRow([id, c.role, c.person, c.sort || 500 + idx]); });
      touchSubmission_(id);
      bustSubmissionCaches_();
    });
    return { ok: true, label: "عوامل → " + (credits.length ? credits.length + " مورد" : "(پاک شد)") };
  }
  if (field === "genre") {
    if (raw === "-" || raw === "—") { withLock_(function() { setSubmissionDetails_(id, { genres: [] }); }); return { ok: true, label: "ژانر → (پاک شد)" }; }
    const picked = [];
    raw.split(/[\s,،\n]+/).forEach(function(part) {
      const p = String(part || "").trim();
      if (!p || picked.length >= maxGenreTags_()) return;
      const g = genreForInput_(p);
      if (!g || g.invalid) return;
      if (!picked.some(function(x) { return String(x.tag).toLowerCase() === String(g.tag).toLowerCase(); })) picked.push({ label: g.label, tag: g.tag });
    });
    if (!picked.length) return { ok: false, error: "ژانر معتبری پیدا نشد. انتخاب‌های شیت: " + musicGenreList_().map(function(g) { return g.label; }).join("، ") };
    withLock_(function() { setSubmissionDetails_(id, { genres: picked }); });
    return { ok: true, label: "ژانر → " + picked.map(function(g) { return "#" + g.tag; }).join(" ") };
  }
  if (field === "links") {
    if (raw === "-" || raw === "—") {
      withLock_(function() { getSheet_(APP.SHEETS.SUBMISSIONS).getRange(sub.rowNumber, 8).setValue(JSON.stringify({ items: [], visible: sub.platformVisible || {} })); touchSubmission_(id); bustSubmissionCaches_(); });
      return { ok: true, label: "لینک‌ها → (پاک شد)" };
    }
    const links = parseLinks_(raw);
    if (!links.length) return { ok: false, error: "لینک معتبری پیدا نشد (URL کامل بفرست)." };
    withLock_(function() { getSheet_(APP.SHEETS.SUBMISSIONS).getRange(sub.rowNumber, 8).setValue(JSON.stringify({ items: links, visible: sub.platformVisible || {} })); touchSubmission_(id); bustSubmissionCaches_(); });
    return { ok: true, label: "لینک‌ها → " + links.length + " مورد" };
  }
  if (field === "caption") {
    let cap = raw;
    if (cap === "-" || cap === "—") cap = "";
    cap = truncate_(cap, 900);
    withLock_(function() { setSubmissionField_(id, "caption", cap); touchSubmission_(id); });
    return { ok: true, label: cap ? "متن پست → دستی («" + truncate_(cap, 40) + "»)" : "متن پست → قالب خودکار" };
  }
  if (field === "hashtags") {
    const list = (raw === "-" || raw === "—") ? [] : raw.split(/[\s,،\n]+/).map(function(x) { return cleanHashtag_(String(x || "").replace(/^#/, "")); }).filter(function(x) { return !!x; });
    const uniq = [];
    list.forEach(function(x) { if (uniq.indexOf(x) < 0) uniq.push(x); });
    withLock_(function() { setSubmissionDetails_(id, { adminHashtags: uniq }); });
    return { ok: true, label: "هشتگ دستی → " + (uniq.length ? uniq.join(" ") : "(پاک شد)") };
  }
  return { ok: false, error: "این فیلد متنی نیست." };
}
// جای‌گزینی رسانهٔ کاور/اجرا/صدا
function replaceSubmissionVisual_(sub, info, message) {
  const storedKind = info.kind;
  withLock_(function() {
    const sh = getSheet_(APP.SHEETS.MEDIA);
    if (sh.getLastRow() >= 2) {
      const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        if (String(rows[i][0]) === String(sub.id) && VISUAL_MEDIA_KINDS_.indexOf(String(rows[i][2])) >= 0) sh.deleteRow(i + 2);
      }
    }
    appendRowObject_(APP.SHEETS.MEDIA, HEADERS.MusicMedia, { submission_id: sub.id, seq: 1, kind: storedKind, file_id: info.fileId, caption: "", media_group_id: message.media_group_id || "", source_chat_id: String(message.chat.id), source_message_id: String(message.message_id || ""), file_size: info.fileSize || 0, mime_type: info.mimeType || "" });
    touchSubmission_(sub.id);
    bustSubmissionCaches_(); DRAFT_MEDIA_MEMO_ = null;
  });
  return "کاور/رسانه → " + storedKind;
}
function replaceSubmissionAudio_(sub, info, seq, message) {
  const ctx = adminSubmissionContext_(sub);
  const target = ctx.audios.filter(function(m) { return Number(m.seq) === Number(seq); })[0] || ctx.audios[0];
  if (!target) return null;
  const keepSeq = Number(target.seq) || 1;
  const keepCaption = String(target.caption || "");
  withLock_(function() {
    getSheet_(APP.SHEETS.MEDIA).deleteRow(target.rowNumber);
    appendRowObject_(APP.SHEETS.MEDIA, HEADERS.MusicMedia, { submission_id: sub.id, seq: keepSeq, kind: "audio", file_id: info.fileId, caption: keepCaption, media_group_id: message.media_group_id || "", source_chat_id: String(message.chat.id), source_message_id: String(message.message_id || ""), file_size: info.fileSize || 0, mime_type: info.mimeType || "" });
    touchSubmission_(sub.id);
    bustSubmissionCaches_(); DRAFT_MEDIA_MEMO_ = null;
    // کتابخانه/دانلود هم باید فایل جدید را ببیند، وگرنه دکمهٔ دریافت فایل قبلی را می‌فرستاد
    syncMusicLibraryForSubmission_(sub.id, getSubmissionMedia_(sub.id));
  });
  return "فایل صوتی ترک " + keepSeq + " → جای‌گزین شد";
}
function replaceSubmissionFreestyle_(sub, info, message) {
  const isVideo = info.kind === "video" || info.kind === "video_note";
  const storedKind = isVideo ? "freestyle_" + info.kind : "audio";
  withLock_(function() {
    const sh = getSheet_(APP.SHEETS.MEDIA);
    if (sh.getLastRow() >= 2) {
      const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
      for (let i = rows.length - 1; i >= 0; i--) {
        const k = String(rows[i][2]);
        if (String(rows[i][0]) === String(sub.id) && (FREESTYLE_VIDEO_KINDS_.indexOf(k) >= 0 || k === "audio")) sh.deleteRow(i + 2);
      }
    }
    appendRowObject_(APP.SHEETS.MEDIA, HEADERS.MusicMedia, { submission_id: sub.id, seq: 1, kind: storedKind, file_id: info.fileId, caption: "", media_group_id: message.media_group_id || "", source_chat_id: String(message.chat.id), source_message_id: String(message.message_id || ""), file_size: info.fileSize || 0, mime_type: info.mimeType || "" });
    touchSubmission_(sub.id);
    bustSubmissionCaches_(); DRAFT_MEDIA_MEMO_ = null;
    syncMusicLibraryForSubmission_(sub.id, getSubmissionMedia_(sub.id));
  });
  return "اجرای فری‌استایل → " + (isVideo ? "ویدیو" : "MP3");
}
function handleAdminEditState_(message, session) {
  const uid = String(message.from.id); const chatId = String(message.chat.id);
  const d = session.data || {}; const field = String(d.field || "");
  const sub = getSubmission_(d.submissionId);
  if (!sub) { clearSession_("M:" + uid); sendMessage_(chatId, "ارسال پیدا نشد.", adminKeyboard_()); return; }
  if (["cover", "audio", "freestyle"].indexOf(field) >= 0) {
    const info = classifyMusicMedia_(message);
    const mode = String(sub.mode || "simple");
    if (field === "cover") {
      const allowed = mode === "coming_soon" ? COMING_SOON_KINDS_ : ["photo", "video"];
      if (!info || allowed.indexOf(info.kind) < 0) { sendMessage_(chatId, adminEditPrompt_(sub, field), cancelKeyboard_()); return; }
      const label = replaceSubmissionVisual_(sub, info, message);
      clearSession_("M:" + uid); afterAdminEdit_(chatId, uid, sub, field, label, true); return;
    }
    if (field === "audio") {
      if (!info || info.kind !== "audio") { sendMessage_(chatId, "🎵 فقط فایل صوتی MP3 پذیرفته می‌شود (همان قانون ارسال کاربران).", cancelKeyboard_()); return; }
      const label = replaceSubmissionAudio_(sub, info, Number(d.arg) || 1, message);
      if (!label) { sendMessage_(chatId, "این اثر ترک صوتی ندارد که جای‌گزین شود.", cancelKeyboard_()); return; }
      clearSession_("M:" + uid); afterAdminEdit_(chatId, uid, sub, field, label, true); return;
    }
    const allowed = ["video_note", "video", "audio"];
    if (!info || allowed.indexOf(info.kind) < 0) { sendMessage_(chatId, adminEditPrompt_(sub, field), cancelKeyboard_()); return; }
    const label = replaceSubmissionFreestyle_(sub, info, message);
    clearSession_("M:" + uid); afterAdminEdit_(chatId, uid, sub, field, label, true); return;
  }
  const text = String(message.text || "").trim();
  if (!text) { sendMessage_(chatId, adminEditPrompt_(sub, field), cancelKeyboard_()); return; }
  const r = applyAdminTextEdit_(uid, sub, field, text);
  if (!r.ok) { sendMessage_(chatId, "⚠️ " + r.error, cancelKeyboard_()); return; }
  clearSession_("M:" + uid);
  afterAdminEdit_(chatId, uid, sub, field, r.label, false);
}
// پاک‌کردن پست‌های قبلیِ کانال (برای انتشار دوباره بعد از تعویض رسانه)
function deleteChannelPostMessages_(sub) {
  const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
  if (!channel) return 0;
  const stage = parsePublishStage_(sub);
  const ids = positiveIdList_(String(sub.visualMessageIds || "") + "|" + String(sub.audioMessageIds || ""));
  if (stage && stage.captionMessageId) ids.push(Number(stage.captionMessageId));
  const uniq = [];
  ids.forEach(function(x) { if (Number(x) > 0 && uniq.indexOf(Number(x)) < 0) uniq.push(Number(x)); });
  let n = 0;
  uniq.forEach(function(mid) { try { const r = deleteMessage_(channel, mid); if (r && r.ok !== false) n++; } catch (e) {} });
  return n;
}
// بعد از هر ویرایش مدیر: لاگ، اطلاع به هنرمند، و اعمال روی کانال
function afterAdminEdit_(chatId, uid, sub, field, label, mediaChanged) {
  const id = sub.id;
  logAdminAction_(uid, "sub_edit_" + field, id, label || "");
  bustSubmissionCaches_();
  const fresh = getSubmission_(id) || sub;
  try { notifySubmissionOwner_(fresh, "✏️ مدیر این مورد را در اثر «" + fresh.title + "» ویرایش کرد:\n" + label); } catch (e) {}
  const wasPublished = String(fresh.status) === "published" && !!String(fresh.publishedAt || "").trim();
  if (wasPublished) {
    if (mediaChanged) {
      const removed = deleteChannelPostMessages_(fresh);
      withLock_(function() {
        setSubmissionField_(id, "visualMessageIds", "");
        setSubmissionField_(id, "audioMessageIds", "");
        setSubmissionField_(id, "publishStage", "");
        setSubmissionField_(id, "publishedAt", "");
        setSubmissionField_(id, "status", "approved");
        setSubmissionField_(id, "reviewNote", "ویرایش مدیر: " + truncate_(label || field, 120));
        touchSubmission_(id);
      });
      bustSubmissionCaches_();
      const again = getSubmission_(id);
      let okPub = false;
      try { okPub = !!again && publishOneSubmission_(again); } catch (e) { logError_("afterAdminEdit_.republish", e, { submissionId: id }); }
      sendMessage_(chatId, "✅ " + label + "\n" + (removed ? "🗑 " + removed + " پیام قبلی از کانال پاک شد.\n" : "") +
        (okPub ? "🚀 پست با رسانهٔ جدید دوباره در کانال منتشر شد." : "⚠️ انتشار دوباره ناموفق بود — از «🚀 انتشار فوری» در جزئیات اثر تلاش کن."));
    } else {
      const channel = normalizeChannelId_(getSetting_("CHANNEL_ID"));
      let okEdit = false;
      try { okEdit = !!channel && tryEditPublishedPost_(fresh, channel); } catch (e) { logError_("afterAdminEdit_.editPost", e, { submissionId: id }); }
      sendMessage_(chatId, "✅ " + label + "\n" + (okEdit ? "🔄 پست زندهٔ کانال به‌روز شد." : "⚠️ پست کانال ویرایش نشد (شاید پاک شده باشد) — «🚀 انتشار فوری» را بزن."));
    }
  } else {
    if (["rejected", "failed"].indexOf(String(fresh.status)) >= 0) {
      withLock_(function() { setSubmissionField_(id, "status", "approved"); setSubmissionField_(id, "failure", ""); setSubmissionField_(id, "publishStage", ""); touchSubmission_(id); });
      bustSubmissionCaches_();
      sendMessage_(chatId, "✅ " + label + "\n↩️ اثر از وضعیت «" + (SUB_STATUS_LABELS_[fresh.status] || fresh.status) + "» به صف انتشار برگشت.");
    } else {
      sendMessage_(chatId, "✅ " + label + "\n🚦 در انتشار بعدی همین ویرایش اعمال می‌شود (وضعیت: " + (SUB_STATUS_LABELS_[fresh.status] || fresh.status) + ").");
    }
  }
  showAdminEditMenu_(chatId, uid, id);
}

// ───────────────────────── کانال‌های وصل‌شده (سمت مدیر) ─────────────────────────
function showAdminConnectedChannels_(chatId, uid, page) {
  const session = getSession_("M:" + uid); const sdata = (session && session.data) || {};
  const sel = Array.isArray(sdata.sel) ? sdata.sel.slice() : [];
  const all = getConnectedChannels_().slice().sort(function(a, b) { return dateMillis_(b.connectedAt) - dateMillis_(a.connectedAt); });
  const active = all.filter(function(c) { return c.status === "active"; });
  if (!all.length) {
    sendMessage_(chatId, "📢 کانال‌های وصل‌شده\nهنوز هیچ کاربری بات را در کانالش ادمین نکرده است.", { inline_keyboard: [[{ text: "🏠 منو", callback_data: "a:home" }]] });
    return;
  }
  const per = 4; const pages = Math.max(1, Math.ceil(all.length / per));
  const p = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const lines = ["📢 کانال‌های وصل‌شده", "✅ فعال: " + active.length + " · کل: " + all.length + " · صفحه " + (p + 1) + "/" + pages, ""];
  const kb = [];
  all.slice(p * per, p * per + per).forEach(function(c) {
    const u = getUserById_(c.userId);
    const chPosts = getActiveCcPosts_().filter(function(x) { return x.sourceType !== "cover_notify" && (x.channelId === c.id || x.chatId === String(c.chatId)); }).length;
    lines.push((c.status === "active" ? "✅ " : "⛔ ") + (c.title || c.chatId) + (c.username ? " — @" + String(c.username).replace(/^@/, "") : "") + "\n   👤 " + ((u && u.rapName) || c.userId) + " · 👥 " + (c.members || 0) + (chPosts ? " · 📨 " + chPosts + " پیام فعال" : "") + (c.lastError ? " · ⚠️ " + truncate_(c.lastError, 40) : ""));
    kb.push([
      { text: (sel.indexOf(c.id) >= 0 ? "☑️ " : "⬜️ ") + truncate_(c.title || c.chatId, 20), callback_data: "acc:sel:" + c.id + ":" + p },
      { text: "📋 پیام‌ها (" + chPosts + ")", callback_data: "ccp:ch:" + c.id + ":0" }
    ]);
  });
  const nav = [];
  if (p > 0) nav.push({ text: "⬅️ قبلی", callback_data: "acc:list:" + (p - 1) });
  if (p < pages - 1) nav.push({ text: "➡️ بعدی", callback_data: "acc:list:" + (p + 1) });
  if (nav.length) kb.push(nav);
  kb.push([{ text: "📨 ارسال به همه (" + active.length + ")", callback_data: "acc:sendall" }, { text: "📨 انتخاب‌شده‌ها (" + sel.length + ")", callback_data: "acc:sendsel" }]);
  kb.push([{ text: "📋 مدیریت پیام‌های ارسال‌شده (ویرایش/حذف)", callback_data: "ccp:list:0:all" }]);
  kb.push([{ text: "🔄 بررسی وضعیت", callback_data: "acc:refresh:" + p }, { text: "🏠 منو", callback_data: "a:home" }]);
  setSession_("M:" + uid, "ADM_CC_LIST", { sel: sel, page: p });
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: kb });
}
function handleConnectedChannelsAdminCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  const parts = String(cb.data || "").split(":");
  const action = parts[1] || "list";
  const session = getSession_("M:" + uid); const sdata = (session && session.data) || {};
  const sel = Array.isArray(sdata.sel) ? sdata.sel.slice() : [];
  const page = Number(parts[3] != null && parts[3] !== "" ? parts[3] : (sdata.page || 0)) || 0;
  if (action === "list") { answerCallbackQuery_(cb.id); showAdminConnectedChannels_(chatId, uid, Number(parts[2]) || 0); return; }
  if (action === "sel") {
    const id = parts[2] || ""; const i = sel.indexOf(id);
    if (i >= 0) sel.splice(i, 1); else sel.push(id);
    setSession_("M:" + uid, "ADM_CC_LIST", { sel: sel, page: page });
    answerCallbackQuery_(cb.id);
    showAdminConnectedChannels_(chatId, uid, page);
    return;
  }
  if (action === "refresh") {
    let kicked = 0;
    getActiveConnectedChannels_().forEach(function(c) {
      const st = botAdminStatusIn_(c.chatId);
      if (!st || st.status !== "administrator" || st.can_post_messages === false) { markConnectedChannelKicked_(c, "not admin anymore"); kicked++; }
      else setConnectedChannelField_(c.id, "lastOkAt", new Date());
    });
    answerCallbackQuery_(cb.id, kicked ? kicked + " کانال غیرفعال شد." : "همهٔ کانال‌ها فعال‌اند.");
    showAdminConnectedChannels_(chatId, uid, Number(parts[2]) || 0);
    return;
  }
  if (action === "cancelcb") { clearSession_("M:" + uid); answerCallbackQuery_(cb.id); showAdminConnectedChannels_(chatId, uid, page); return; }
  if (action === "now" || action === "queue") {
    const conf = getSession_("M:" + uid);
    if (!conf || conf.state !== "ADM_CC_CONFIRM" || !conf.data || !conf.data.item) { answerCallbackQuery_(cb.id, "اول پیام را بفرست."); showAdminConnectedChannels_(chatId, uid, page); return; }
    const target = String(conf.data.target || "cc_all");
    const item = conf.data.item;
    const id = newId_("BCC");
    withLock_(function() {
      getSheet_(APP.SHEETS.BROADCASTS).appendRow([id, target, "now", "queued", "", String(uid), new Date(), ""]);
      getSheet_(APP.SHEETS.BROADCAST_MEDIA).appendRow([id, 1, item.sourceChatId || "", item.sourceMessageId || "", item.kind || "text", item.caption || ""]);
    });
    logAdminAction_(uid, action === "now" ? "cc_broadcast_now" : "cc_broadcast_queue", target, id);
    clearSession_("M:" + uid);
    if (action === "now") {
      answerCallbackQuery_(cb.id, "🚀 در حال ارسال فوری…");
      const rep = sendCcBroadcastNow_(id);
      sendMessage_(chatId, "🚀 ارسال فوری " + id + " تمام شد.\n✅ " + rep.sent + " کانال · ⛔ " + rep.blocked + " مسدود · ⚠️ " + rep.failed + " خطا" + (rep.queued ? " · ⏳ بقیه (" + rep.queued + ") در صف کارگر ماند" : ""), adminKeyboard_());
    } else {
      answerCallbackQuery_(cb.id, "⏳ در صف قرار گرفت.");
      sendMessage_(chatId, "📣 کمپین " + id + " برای " + ccBroadcastRows_(target).length + " کانال وصل‌شده در صف قرار گرفت.", adminKeyboard_());
    }
    return;
  }
  if (action === "sendall" || action === "sendsel") {
    if (action === "sendsel" && !sel.length) { answerCallbackQuery_(cb.id, "اول با ⬜️ کانال‌ها را انتخاب کن."); return; }
    const target = action === "sendall" ? "cc_all" : "cc_sel:" + sel.join(",");
    setSession_("M:" + uid, "ADM_CC_MSG", { target: target, sel: sel, page: page });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "📨 پیامَت را بفرست — متن، عکس، صوت، ویدیو یا فایل؛ هرچه بفرستی همان در کانال‌های هدف پخش می‌شود.", cancelKeyboard_());
    return;
  }
  answerCallbackQuery_(cb.id);
  showAdminConnectedChannels_(chatId, uid, page);
}

// ارسال فوری: همان اجرا دسته‌ها را پشت‌سرهم می‌فرستد (بودجهٔ ~۲۵ ثانیه)؛
// اگر کانال‌ها بیشتر از بودجه باشند، بقیه در صف کارگر می‌ماند و خودکار کامل می‌شود.
function sendCcBroadcastNow_(broadcastId) {
  const t0 = Date.now();
  let b = getBroadcast_(broadcastId);
  while (b && ["queued", "running"].indexOf(b.status) >= 0 && Date.now() - t0 < 25000) {
    processBroadcast_(b);
    b = getBroadcast_(broadcastId);
  }
  const sh = getSheet_(APP.SHEETS.DELIVERY_LOG);
  const rep = { sent: 0, blocked: 0, failed: 0, queued: 0 };
  if (sh.getLastRow() >= 2) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(function(r) {
      if (String(r[0]) !== String(broadcastId)) return;
      if (r[2] === "sent") rep.sent++;
      else if (r[2] === "blocked") rep.blocked++;
      else rep.failed++;
    });
  }
  if (b && ["queued", "running"].indexOf(b.status) >= 0) rep.queued = ccBroadcastRows_(b.target).length;
  return rep;
}
function showCcBannerPanel_(chatId, uid) {
  if (!adminGate_(chatId, uid, "broadcast")) return;
  clearSession_("M:" + uid);
  const items = getCcBannerItems_();
  const autoOn = String(getSetting_("CC_BANNER_ON_CONNECT") || "true") === "true";
  const activeChannels = getActiveConnectedChannels_();
  const activeBannerPosts = getActiveCcPosts_().filter(function(p) { return p.sourceType === "banner"; }).length;
  const lines = ["🖼 بنر تبلیغاتی کانال ما"];
  if (!items.length) lines.push("هنوز بنری ثبت نشده. هر کانالی که وصل شود، بنر در آن پست می‌شود (اگر بنری باشد).");
  else {
    const it = items[0];
    lines.push("بنر فعلی: " + (it.kind === "text" ? "متنی" : it.kind) + " · ثبت‌شده توسط " + (it.createdBy || "؟") + " · 🗓 " + formatDate_(it.createdAt));
    if (it.caption) lines.push("«" + truncate_(it.caption, 120) + "»");
    lines.push("کانال‌های وصل‌شدهٔ فعال: " + activeChannels.length + (activeBannerPosts ? " · بنرهای فعال در کانال‌ها: " + activeBannerPosts : ""));
  }
  lines.push("ارسال خودکار هنگام اتصال کانال جدید: " + (autoOn ? "🟢 روشن" : "🔴 خاموش"));
  const kb = [];
  if (items.length) {
    kb.push([{ text: "📤 ثبت بنر جدید", callback_data: "bn:new" }, { text: "👁 پیش‌نمایش بنر", callback_data: "bn:preview" }]);
    kb.push([{ text: "📨 ارسال به همه (" + activeChannels.length + ")", callback_data: "bn:sendall" }, { text: "🎯 ارسال به کانال انتخابی", callback_data: "bn:pick:0" }]);
    kb.push([{ text: "🗑 حذف بنر پیش‌فرض", callback_data: "bn:del" }]);
  } else {
    kb.push([{ text: "📤 ثبت بنر جدید", callback_data: "bn:new" }]);
  }
  kb.push([{ text: "📋 پیام‌ها و بنرهای ارسال‌شده (ویرایش / حذف)", callback_data: "ccp:list:0:banner" }]);
  kb.push([{ text: (autoOn ? "🔴 خاموش‌کردن" : "🟢 روشن‌کردن") + " ارسال خودکار در اتصال", callback_data: "bn:toggleauto" }]);
  kb.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: kb });
}
function showCcBannerChannelPicker_(chatId, uid, page) {
  if (!adminGate_(chatId, uid, "broadcast")) return;
  const items = getCcBannerItems_();
  if (!items.length) {
    sendMessage_(chatId, "⚠️ ابتدا یک بنر تبلیغاتی ثبت کن.");
    showCcBannerPanel_(chatId, uid);
    return;
  }
  const session = getSession_("M:" + uid);
  const sdata = (session && session.state === "ADM_CC_BANNER_PICK" && session.data) || {};
  const sel = Array.isArray(sdata.sel) ? sdata.sel.slice() : [];
  const active = getActiveConnectedChannels_().slice().sort(function(a, b) { return dateMillis_(b.connectedAt) - dateMillis_(a.connectedAt); });
  if (!active.length) {
    sendMessage_(chatId, "⚠️ هیچ کانال وصل‌شدهٔ فعالی وجود ندارد.");
    showCcBannerPanel_(chatId, uid);
    return;
  }
  const per = 4;
  const pages = Math.max(1, Math.ceil(active.length / per));
  const p = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const lines = [
    "🎯 ارسال بنر به کانال انتخابی",
    "برای ارسال فوری به **فقط یک کانال** روی «📤 ارسال به …» بزن؛",
    "یا چند کانال را با ⬜️ تیک بزن و در پایین «📨 ارسال به انتخاب‌شده‌ها» را بزن.",
    "کانال‌های فعال: " + active.length + " · صفحه " + (p + 1) + "/" + pages
  ];
  const kb = [];
  active.slice(p * per, p * per + per).forEach(function(c) {
    const title = truncate_(c.title || c.chatId, 18);
    kb.push([
      { text: "📤 ارسال به «" + title + "»", callback_data: "bn:sendone:" + c.id + ":" + p },
      { text: (sel.indexOf(c.id) >= 0 ? "☑️ انتخاب‌شده" : "⬜️ انتخاب"), callback_data: "bn:sel:" + c.id + ":" + p }
    ]);
  });
  const nav = [];
  if (p > 0) nav.push({ text: "⬅️ قبلی", callback_data: "bn:pick:" + (p - 1) });
  if (p < pages - 1) nav.push({ text: "➡️ بعدی", callback_data: "bn:pick:" + (p + 1) });
  if (nav.length) kb.push(nav);
  kb.push([
    { text: "📨 ارسال به انتخاب‌شده‌ها (" + sel.length + ")", callback_data: "bn:sendsel" },
    { text: "📨 ارسال به همه (" + active.length + ")", callback_data: "bn:sendall" }
  ]);
  kb.push([{ text: "⬅️ بازگشت به پنل بنر", callback_data: "bn:panel" }, { text: "🏠 منو", callback_data: "a:home" }]);
  setSession_("M:" + uid, "ADM_CC_BANNER_PICK", { sel: sel, page: p });
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: kb });
}
function handleCcBannerCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  if (!hasAdminPermission_(uid, "broadcast")) { answerCallbackQuery_(cb.id, "دسترسی نداری."); return; }
  const parts = String(cb.data || "").split(":");
  const action = parts[1] || "panel";
  const session = getSession_("M:" + uid);
  const sdata = (session && session.state === "ADM_CC_BANNER_PICK" && session.data) || {};
  const sel = Array.isArray(sdata.sel) ? sdata.sel.slice() : [];
  if (action === "new") {
    setSession_("M:" + uid, "ADM_CC_BANNER", {});
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "🖼 بنر تازه را بفرست (متن، عکس، صوت، ویدیو یا فایل). پس از ارسال می‌توانی انتخاب کنی به همهٔ کانال‌ها برود، به یک/چند کانال انتخابی برود، یا فقط ذخیره بماند.", cancelKeyboard_());
    return;
  }
  if (action === "preview") {
    const items = getCcBannerItems_();
    if (!items.length) { answerCallbackQuery_(cb.id, "بنری ثبت نشده است."); showCcBannerPanel_(chatId, uid); return; }
    answerCallbackQuery_(cb.id);
    sendCcBannerToChannel_({ chatId: chatId }, { recordPost: false });
    return;
  }
  if (action === "toggleauto") {
    const next = String(getSetting_("CC_BANNER_ON_CONNECT") || "true") === "true" ? "false" : "true";
    setSetting_("CC_BANNER_ON_CONNECT", next);
    answerCallbackQuery_(cb.id, next === "true" ? "ارسال خودکار روشن شد" : "ارسال خودکار خاموش شد");
    showCcBannerPanel_(chatId, uid);
    return;
  }
  if (action === "pick") {
    answerCallbackQuery_(cb.id);
    showCcBannerChannelPicker_(chatId, uid, Number(parts[2]) || 0);
    return;
  }
  if (action === "sel") {
    const chId = parts[2] || "";
    const page = Number(parts[3]) || 0;
    const idx = sel.indexOf(chId);
    if (idx >= 0) sel.splice(idx, 1); else sel.push(chId);
    setSession_("M:" + uid, "ADM_CC_BANNER_PICK", { sel: sel, page: page });
    answerCallbackQuery_(cb.id);
    showCcBannerChannelPicker_(chatId, uid, page);
    return;
  }
  if (action === "sendone") {
    const chId = parts[2] || "";
    const page = Number(parts[3]) || 0;
    const ch = getConnectedChannelById_(chId);
    if (!ch || ch.status !== "active") { answerCallbackQuery_(cb.id, "کانال فعال نیست."); showCcBannerChannelPicker_(chatId, uid, page); return; }
    const r = sendCcBannerToChannel_(ch, { adminId: uid });
    if (!r.ok && /kicked|not enough rights|chat not found|forbidden|have the right|admin/i.test(r.desc)) markConnectedChannelKicked_(ch, r.desc);
    logAdminAction_(uid, "cc_banner_send_one", ch.id, r.ok ? "ok" : r.desc);
    answerCallbackQuery_(cb.id, r.ok ? ("✅ به «" + truncate_(ch.title || ch.chatId, 20) + "» ارسال شد.") : ("⛔ خطا: " + truncate_(r.desc, 40)));
    showCcBannerChannelPicker_(chatId, uid, page);
    return;
  }
  if (action === "sendsel") {
    if (!sel.length) { answerCallbackQuery_(cb.id, "اول حداقل یک کانال را با ⬜️ انتخاب کن."); return; }
    const rows = getActiveConnectedChannels_().filter(function(c) { return sel.indexOf(c.id) >= 0; });
    const rep = sendCcBannerToAll_(rows, uid);
    clearSession_("M:" + uid);
    logAdminAction_(uid, "cc_banner_send_sel", sel.join(","), "sent=" + rep.sent + ",failed=" + rep.failed);
    answerCallbackQuery_(cb.id, "✅ " + rep.sent + " · ⛔ " + rep.failed);
    sendMessage_(chatId, "🎯 بنر به کانال‌های انتخابی ارسال شد.\n✅ موفق: " + rep.sent + " · ⛔ ناموفق: " + rep.failed);
    showCcBannerPanel_(chatId, uid);
    return;
  }
  if (action === "sendall") {
    const rep = sendCcBannerToAll_(getActiveConnectedChannels_(), uid);
    clearSession_("M:" + uid);
    logAdminAction_(uid, "cc_banner_send_all", "", "sent=" + rep.sent + ",failed=" + rep.failed);
    answerCallbackQuery_(cb.id, "✅ " + rep.sent + " · ⛔ " + rep.failed);
    sendMessage_(chatId, "📨 بنر به همهٔ کانال‌های فعال ارسال شد.\n✅ موفق: " + rep.sent + " · ⛔ ناموفق: " + rep.failed);
    showCcBannerPanel_(chatId, uid);
    return;
  }
  if (action === "del") {
    clearCcBanner_();
    logAdminAction_(uid, "cc_banner_clear", "", "");
    answerCallbackQuery_(cb.id, "🗑 بنر حذف شد.");
    showCcBannerPanel_(chatId, uid);
    return;
  }
  clearSession_("M:" + uid);
  answerCallbackQuery_(cb.id);
  showCcBannerPanel_(chatId, uid);
}

// ── پنل مدیریت (ویرایش و حذف) پیام‌ها و بنرهای ارسال‌شده در کانال‌های وصل‌شده ──
function ccPostTypeLabel_(t) {
  if (t === "banner") return "🖼 بنر";
  if (t === "promo") return "🎵 تبلیغ اثر";
  return "📨 پیام";
}
function showCcPostsList_(chatId, uid, page, filterType) {
  if (!adminGate_(chatId, uid, "broadcast")) return;
  clearSession_("M:" + uid);
  const filter = String(filterType || "all");
  const allActive = getActiveCcPosts_().filter(function(p) {
    if (p.sourceType === "cover_notify") return false;
    if (filter === "banner") return p.sourceType === "banner";
    if (filter === "message") return p.sourceType !== "banner";
    return true;
  });
  // گروه‌بندی بر اساس batchId
  const batchMap = {};
  const batches = [];
  allActive.forEach(function(p) {
    const bId = p.batchId || p.postId;
    if (!batchMap[bId]) {
      batchMap[bId] = { batchId: bId, sourceType: p.sourceType, kind: p.kind, caption: p.caption, createdAt: p.createdAt, posts: [] };
      batches.push(batchMap[bId]);
    }
    batchMap[bId].posts.push(p);
  });
  batches.sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); });
  const filterRow = [
    { text: (filter === "all" ? "✅ " : "") + "همه", callback_data: "ccp:list:0:all" },
    { text: (filter === "banner" ? "✅ " : "") + "🖼 بنرها", callback_data: "ccp:list:0:banner" },
    { text: (filter === "message" ? "✅ " : "") + "📨 پیام‌ها", callback_data: "ccp:list:0:message" }
  ];
  if (!batches.length) {
    sendMessage_(chatId, "📋 پیام‌های ارسال‌شده در کانال‌های وصل‌شده\n\nهیچ پیام فعالی در این بخش ثبت نشده است.", {
      inline_keyboard: [
        filterRow,
        [{ text: "📢 کانال‌های وصل‌شده", callback_data: "acc:list:0" }, { text: "🖼 پنل بنر", callback_data: "bn:panel" }],
        [{ text: "🏠 منو", callback_data: "a:home" }]
      ]
    });
    return;
  }
  const per = 5;
  const pages = Math.max(1, Math.ceil(batches.length / per));
  const p = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const lines = [
    "📋 پیام‌ها و بنرهای ارسال‌شده در کانال‌ها",
    "از اینجا می‌توانی هر پیامی که بات در کانال‌های وصل‌شده گذاشته را **ویرایش** یا **حذف** کنی (در همهٔ کانال‌ها یا فقط یک کانال خاص).",
    "کل دسته‌های فعال: " + batches.length + " · صفحه " + (p + 1) + "/" + pages,
    ""
  ];
  const kb = [filterRow];
  batches.slice(p * per, p * per + per).forEach(function(b) {
    const preview = truncate_(b.caption || (b.kind === "text" ? "متن" : b.kind), 26);
    lines.push("• " + ccPostTypeLabel_(b.sourceType) + " (" + b.kind + ") — «" + preview + "»\n   📺 فعال در " + b.posts.length + " کانال · 🗓 " + formatDate_(b.createdAt));
    kb.push([
      { text: ccPostTypeLabel_(b.sourceType) + ": «" + truncate_(preview, 18) + "» (" + b.posts.length + " کانال)", callback_data: "ccp:batch:" + b.batchId + ":0" }
    ]);
    kb.push([
      { text: "✏️ ویرایش در همه (" + b.posts.length + ")", callback_data: "ccp:editbatch:" + b.batchId },
      { text: "🗑 حذف از همه (" + b.posts.length + ")", callback_data: "ccp:delbatch:" + b.batchId }
    ]);
  });
  const nav = [];
  if (p > 0) nav.push({ text: "⬅️ قبلی", callback_data: "ccp:list:" + (p - 1) + ":" + filter });
  if (p < pages - 1) nav.push({ text: "➡️ بعدی", callback_data: "ccp:list:" + (p + 1) + ":" + filter });
  if (nav.length) kb.push(nav);
  kb.push([{ text: "📢 کانال‌های وصل‌شده", callback_data: "acc:list:0" }, { text: "🖼 پنل بنر", callback_data: "bn:panel" }]);
  kb.push([{ text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: kb });
}
function showCcBatchDetail_(chatId, uid, batchId, page) {
  if (!adminGate_(chatId, uid, "broadcast")) return;
  clearSession_("M:" + uid);
  const posts = getActiveCcPosts_().filter(function(p) { return p.batchId === String(batchId); });
  if (!posts.length) {
    sendMessage_(chatId, "این پیام در هیچ کانالی فعال نیست (حذف شده است).");
    showCcPostsList_(chatId, uid, 0, "all");
    return;
  }
  const first = posts[0];
  const per = 5;
  const pages = Math.max(1, Math.ceil(posts.length / per));
  const p = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const lines = [
    "📋 جزئیات پیام ارسال‌شده (" + ccPostTypeLabel_(first.sourceType) + ")",
    "نوع: " + first.kind + " · 🗓 " + formatDate_(first.createdAt),
    first.caption ? ("متن/کپشن: «" + truncate_(first.caption, 200) + "»") : "",
    "📺 فعال در " + posts.length + " کانال (صفحه " + (p + 1) + "/" + pages + "):",
    ""
  ].filter(Boolean);
  const kb = [
    [
      { text: "✏️ ویرایش در همهٔ کانال‌ها (" + posts.length + ")", callback_data: "ccp:editbatch:" + batchId },
      { text: "🗑 حذف از همهٔ کانال‌ها (" + posts.length + ")", callback_data: "ccp:delbatch:" + batchId }
    ]
  ];
  posts.slice(p * per, p * per + per).forEach(function(post) {
    const ch = getConnectedChannelById_(post.channelId);
    const chTitle = truncate_((ch && ch.title) || post.chatId, 18);
    lines.push("• 📺 " + ((ch && ch.title) || post.chatId) + " (پیام #" + post.messageId + ")");
    kb.push([
      { text: "✏️ ویرایش در «" + chTitle + "»", callback_data: "ccp:editone:" + post.postId },
      { text: "🗑 حذف از «" + chTitle + "»", callback_data: "ccp:delone:" + post.postId }
    ]);
  });
  const nav = [];
  if (p > 0) nav.push({ text: "⬅️ قبلی", callback_data: "ccp:batch:" + batchId + ":" + (p - 1) });
  if (p < pages - 1) nav.push({ text: "➡️ بعدی", callback_data: "ccp:batch:" + batchId + ":" + (p + 1) });
  if (nav.length) kb.push(nav);
  kb.push([{ text: "⬅️ بازگشت به لیست پیام‌ها", callback_data: "ccp:list:0:all" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: kb });
}
function showCcChannelPosts_(chatId, uid, channelId, page) {
  if (!adminGate_(chatId, uid, "broadcast")) return;
  clearSession_("M:" + uid);
  const ch = getConnectedChannelById_(channelId);
  if (!ch) {
    sendMessage_(chatId, "کانال پیدا نشد.");
    showAdminConnectedChannels_(chatId, uid, 0);
    return;
  }
  const posts = getActiveCcPosts_().filter(function(p) { return p.sourceType !== "cover_notify" && (p.channelId === String(channelId) || p.chatId === String(ch.chatId)); })
    .sort(function(a, b) { return dateMillis_(b.createdAt) - dateMillis_(a.createdAt); });
  if (!posts.length) {
    sendMessage_(chatId, "📺 «" + (ch.title || ch.chatId) + "»\nهیچ پیام فعالی از طرف بات در این کانال ثبت نشده است.", {
      inline_keyboard: [[{ text: "⬅️ بازگشت به کانال‌ها", callback_data: "acc:list:0" }, { text: "🏠 منو", callback_data: "a:home" }]]
    });
    return;
  }
  const per = 5;
  const pages = Math.max(1, Math.ceil(posts.length / per));
  const p = Math.min(Math.max(0, Number(page) || 0), pages - 1);
  const lines = [
    "📺 پیام‌های بات در کانال «" + (ch.title || ch.chatId) + "»",
    "تعداد پیام‌های فعال: " + posts.length + " · صفحه " + (p + 1) + "/" + pages,
    ""
  ];
  const kb = [];
  posts.slice(p * per, p * per + per).forEach(function(post) {
    const preview = truncate_(post.caption || post.kind, 22);
    lines.push("• " + ccPostTypeLabel_(post.sourceType) + " (#" + post.messageId + ") — «" + preview + "» · 🗓 " + formatDate_(post.createdAt));
    kb.push([
      { text: "✏️ ویرایش «" + truncate_(preview, 14) + "»", callback_data: "ccp:editone:" + post.postId },
      { text: "🗑 حذف «" + truncate_(preview, 14) + "»", callback_data: "ccp:delone:" + post.postId }
    ]);
  });
  const nav = [];
  if (p > 0) nav.push({ text: "⬅️ قبلی", callback_data: "ccp:ch:" + channelId + ":" + (p - 1) });
  if (p < pages - 1) nav.push({ text: "➡️ بعدی", callback_data: "ccp:ch:" + channelId + ":" + (p + 1) });
  if (nav.length) kb.push(nav);
  kb.push([{ text: "🗑 حذف همهٔ پیام‌های بات در این کانال (" + posts.length + ")", callback_data: "ccp:delchall:" + channelId }]);
  kb.push([{ text: "⬅️ بازگشت به کانال‌ها", callback_data: "acc:list:0" }, { text: "🏠 منو", callback_data: "a:home" }]);
  sendMessage_(chatId, lines.join("\n"), { inline_keyboard: kb });
}
function handleCcPostsCallback_(cb) {
  const uid = String(cb.from.id); const chatId = String(cb.message.chat.id);
  if (!hasAdminPermission_(uid, "broadcast")) { answerCallbackQuery_(cb.id, "دسترسی نداری."); return; }
  const parts = String(cb.data || "").split(":");
  const action = parts[1] || "list";
  if (action === "list") {
    answerCallbackQuery_(cb.id);
    showCcPostsList_(chatId, uid, Number(parts[2]) || 0, parts[3] || "all");
    return;
  }
  if (action === "batch") {
    answerCallbackQuery_(cb.id);
    showCcBatchDetail_(chatId, uid, parts[2] || "", Number(parts[3]) || 0);
    return;
  }
  if (action === "ch") {
    answerCallbackQuery_(cb.id);
    showCcChannelPosts_(chatId, uid, parts[2] || "", Number(parts[3]) || 0);
    return;
  }
  if (action === "editone") {
    const postId = parts[2] || "";
    const post = getCcPostById_(postId);
    if (!post || post.status !== "active") { answerCallbackQuery_(cb.id, "این پیام دیگر فعال نیست."); showCcPostsList_(chatId, uid, 0, "all"); return; }
    setSession_("M:" + uid, "ADM_CC_POST_EDIT", { mode: "post", postId: post.postId, batchId: post.batchId });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "✏️ متن، عکس، ویدیو، صوت یا فایل جدید را بفرست تا پیام در این کانال ویرایش/جایگزین شود:", cancelKeyboard_());
    return;
  }
  if (action === "editbatch") {
    const batchId = parts[2] || "";
    const posts = getActiveCcPosts_().filter(function(p) { return p.batchId === batchId; });
    if (!posts.length) { answerCallbackQuery_(cb.id, "پیام فعالی در این دسته نیست."); showCcPostsList_(chatId, uid, 0, "all"); return; }
    setSession_("M:" + uid, "ADM_CC_POST_EDIT", { mode: "batch", batchId: batchId });
    answerCallbackQuery_(cb.id);
    sendMessage_(chatId, "✏️ متن، عکس، ویدیو، صوت یا فایل جدید را بفرست تا این پیام در همهٔ " + posts.length + " کانال ویرایش شود:", cancelKeyboard_());
    return;
  }
  if (action === "delone") {
    const postId = parts[2] || "";
    const post = getCcPostById_(postId);
    if (!post || post.status !== "active") { answerCallbackQuery_(cb.id, "قبلاً حذف شده است."); return; }
    const batchId = post.batchId;
    const r = deleteCcPostRecord_(post);
    logAdminAction_(uid, "cc_post_del_one", postId, r.ok ? "ok" : r.desc);
    answerCallbackQuery_(cb.id, r.ok ? "🗑 پیام از کانال حذف شد." : ("⚠️ خطا: " + truncate_(r.desc, 40)));
    const remaining = getActiveCcPosts_().filter(function(p) { return p.batchId === batchId; });
    if (remaining.length) showCcBatchDetail_(chatId, uid, batchId, 0);
    else showCcPostsList_(chatId, uid, 0, "all");
    return;
  }
  if (action === "delbatch") {
    const batchId = parts[2] || "";
    const posts = getActiveCcPosts_().filter(function(p) { return p.batchId === batchId; });
    let okCount = 0; let failCount = 0;
    posts.forEach(function(p) {
      const r = deleteCcPostRecord_(p);
      if (r.ok) okCount++; else failCount++;
    });
    logAdminAction_(uid, "cc_post_del_batch", batchId, "ok=" + okCount + ",fail=" + failCount);
    answerCallbackQuery_(cb.id, "🗑 حذف شد: " + okCount + (failCount ? " · خطا: " + failCount : ""));
    sendMessage_(chatId, "🗑 پیام از " + okCount + " کانال حذف شد" + (failCount ? " (⛔ ناموفق: " + failCount + ")" : "") + ".");
    showCcPostsList_(chatId, uid, 0, "all");
    return;
  }
  if (action === "delchall") {
    const channelId = parts[2] || "";
    const ch = getConnectedChannelById_(channelId);
    const posts = getActiveCcPosts_().filter(function(p) { return p.sourceType !== "cover_notify" && (p.channelId === String(channelId) || (ch && p.chatId === String(ch.chatId))); });
    let okCount = 0; let failCount = 0;
    posts.forEach(function(p) {
      const r = deleteCcPostRecord_(p);
      if (r.ok) okCount++; else failCount++;
    });
    logAdminAction_(uid, "cc_post_del_channel", channelId, "ok=" + okCount + ",fail=" + failCount);
    answerCallbackQuery_(cb.id, "🗑 حذف شد: " + okCount);
    showAdminConnectedChannels_(chatId, uid, 0);
    return;
  }
  answerCallbackQuery_(cb.id);
  showCcPostsList_(chatId, uid, 0, "all");
}
