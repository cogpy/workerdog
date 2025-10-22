#include "headers.h"

#include "simdutf.h"

#include <workerd/io/features.h>
#include <workerd/io/io-context.h>
#include <workerd/util/header-validation.h>
#include <workerd/util/strings.h>

namespace workerd::api {

namespace {

#define COMMON_HEADERS(V)                                                                          \
  V("accept-charset")                                                                              \
  V("accept-encoding")                                                                             \
  V("accept-language")                                                                             \
  V("accept-ranges")                                                                               \
  V("accept")                                                                                      \
  V("access-control-allow-origin")                                                                 \
  V("age")                                                                                         \
  V("allow")                                                                                       \
  V("authorization")                                                                               \
  V("cache-control")                                                                               \
  V("content-disposition")                                                                         \
  V("content-encoding")                                                                            \
  V("content-language")                                                                            \
  V("content-length")                                                                              \
  V("content-location")                                                                            \
  V("content-range")                                                                               \
  V("content-type")                                                                                \
  V("cookie")                                                                                      \
  V("date")                                                                                        \
  V("etag")                                                                                        \
  V("expect")                                                                                      \
  V("expires")                                                                                     \
  V("from")                                                                                        \
  V("host")                                                                                        \
  V("if-match")                                                                                    \
  V("if-modified-since")                                                                           \
  V("if-none-match")                                                                               \
  V("if-range")                                                                                    \
  V("if-unmodified-since")                                                                         \
  V("last-modified")                                                                               \
  V("link")                                                                                        \
  V("location")                                                                                    \
  V("max-forwards")                                                                                \
  V("proxy-authenticate")                                                                          \
  V("proxy-authorization")                                                                         \
  V("range")                                                                                       \
  V("referer")                                                                                     \
  V("refresh")                                                                                     \
  V("retry-after")                                                                                 \
  V("server")                                                                                      \
  V("set-cookie")                                                                                  \
  V("strict-transport-security")                                                                   \
  V("transfer-encoding")                                                                           \
  V("user-agent")                                                                                  \
  V("vary")                                                                                        \
  V("via")                                                                                         \
  V("www-authenticate")

// Constexpr array of lowercase common header names (must match CommonHeaderName enum order
// and must be kept in sync with the ordinal values defined in http-over-capnp.capnp). Since
// it is extremely unlikely that those will change often, we hardcode them here for runtime
// efficiency.
#define V(Name) Name##_kj,
constexpr kj::StringPtr COMMON_HEADER_NAMES[] = {nullptr,  // 0: invalid
  COMMON_HEADERS(V)};
#undef V

inline constexpr kj::StringPtr getCommonHeaderName(uint id) {
  KJ_ASSERT(id > 0 && id <= Headers::MAX_COMMON_HEADER_ID, "Invalid common header ID");
  return COMMON_HEADER_NAMES[id];
}

constexpr bool strcaseeq(kj::StringPtr a, kj::StringPtr b) {
  if (a.size() != b.size()) return false;
  for (size_t i = 0; i < a.size(); ++i) {
    char ca = a[i];
    char cb = b[i];
    // Convert to lowercase for comparison
    if ('A' <= ca && ca <= 'Z') ca += 32;
    if ('A' <= cb && cb <= 'Z') cb += 32;
    if (ca != cb) return false;
  }
  return true;
}

constexpr uint caseInsensitiveHash(kj::StringPtr name) {
  uint hash = 2166136261u;
  for (size_t i = 0; i < name.size(); ++i) {
    char c = name[i];
    if ('A' <= c && c <= 'Z') c += 32;
    hash ^= static_cast<uint8_t>(c);
    hash *= 16777619u;
  }
  hash = (hash >> 16) ^ hash;
  return hash;
}

constexpr size_t HEADER_MAP_SIZE = 512;

struct HeaderHashTable final {
  struct Entry {
    kj::StringPtr name;
    uint id;
  };

  Entry entries[HEADER_MAP_SIZE] = {};

  constexpr HeaderHashTable() {
    for (size_t i = 0; i < HEADER_MAP_SIZE; ++i) {
      entries[i] = {nullptr, 0};
    }

    for (uint i = 1; i <= Headers::MAX_COMMON_HEADER_ID; ++i) {
      auto name = COMMON_HEADER_NAMES[i];
      size_t slot = caseInsensitiveHash(name) % HEADER_MAP_SIZE;
      entries[slot] = {name, i};
    }
  }

  constexpr uint find(kj::StringPtr name) const {
    if (name == nullptr) return 0;
    size_t slot = caseInsensitiveHash(name) % HEADER_MAP_SIZE;
    const auto& entry = entries[slot];
    if (entry.id != 0 && entry.name.size() == name.size() && strcaseeq(entry.name, name)) {
      return entry.id;
    }
    return 0;  // Not found
  }

  constexpr bool isPerfectTest() const {
    for (uint i = 1; i <= Headers::MAX_COMMON_HEADER_ID; ++i) {
      auto name = COMMON_HEADER_NAMES[i];
      size_t slot = caseInsensitiveHash(name) % HEADER_MAP_SIZE;
      if (entries[slot].id != i) return false;
      if (!strcaseeq(entries[slot].name, name)) return false;
    }
    return true;
  }
};

constexpr HeaderHashTable HEADER_HASH_TABLE;
static_assert(HEADER_HASH_TABLE.isPerfectTest());
static_assert(HEADER_HASH_TABLE.find("accept-charset"_kj) == 1);
static_assert(HEADER_HASH_TABLE.find("AcCePt-ChArSeT"_kj) == 1);
static_assert(std::size(COMMON_HEADER_NAMES) == (Headers::MAX_COMMON_HEADER_ID + 1));

void maybeWarnIfBadHeaderString(kj::StringPtr str) {
  if (IoContext::hasCurrent()) {
    auto& context = IoContext::current();
    if (context.isInspectorEnabled()) {
      if (!simdutf::validate_ascii(str.begin(), str.size())) {
        // The string contains non-ASCII characters. While any 8-bit value is technically valid
        // in HTTP headers, we encode header strings as UTF-8, so we want to warn the user that
        // their header name/value may not be what they may expect based on what browsers do.
        auto utf8Hex =
            kj::strArray(KJ_MAP(b, str) { return kj::str("\\x", kj::hex(kj::byte(b))); }, "");
        context.logWarning(kj::str("A header value contains non-ASCII characters: \"", str,
            "\" (raw bytes: \"", utf8Hex,
            "\"). As a quirk to support Unicode, we are encoding "
            "values as UTF-8 in the header, but in a browser this would likely result in a "
            "TypeError exception. Consider encoding this string in ASCII for compatibility with "
            "browser implementations of the Fetch specification."));
      }
    }
  }
}

// Left- and right-trim HTTP whitespace from `value`.
kj::String normalizeHeaderValue(kj::String value) {
  // Fast path: if empty, return as-is
  if (value.size() == 0) return kj::mv(value);

  char* begin = value.begin();
  char* end = value.end();

  while (begin < end && util::isHttpWhitespace(*begin)) ++begin;
  while (begin < end && util::isHttpWhitespace(*(end - 1))) --end;

  size_t newSize = end - begin;
  if (newSize == value.size()) {
    JSG_REQUIRE(workerd::util::isValidHeaderValue(value), TypeError, "Invalid header value.");
    maybeWarnIfBadHeaderString(value);
    return kj::mv(value);
  }

  auto trimmed = kj::ArrayPtr(begin, newSize);
  JSG_REQUIRE(workerd::util::isValidHeaderValue(trimmed), TypeError, "Invalid header value.");
  maybeWarnIfBadHeaderString(value);
  // By attaching the original array to the trimmed view, we keep the original allocation alive
  // and prevent an unnecessary copy.
  return kj::str(trimmed.attach(value.releaseArray()));
}

Headers::HeaderKey getHeaderKeyFor(kj::StringPtr name) {
  if (uint commonId = HEADER_HASH_TABLE.find(name)) {
    KJ_DASSERT(commonId > 0 && commonId <= Headers::MAX_COMMON_HEADER_ID);
    return commonId;
  }

  for (char c: name) {
    JSG_REQUIRE(util::isHttpTokenChar(c), TypeError, "Invalid header name.");
  }

  // Not a common header, so allocate lowercase copy for uncommon header
  return toLower(name);
}
}  // namespace

Headers::Headers(jsg::Lock& js, jsg::Dict<kj::String, kj::String> dict): guard(Guard::NONE) {
  // Because the headers might end up in either of our two tables,
  // we can't really reserve space for them up front.
  for (auto& field: dict.fields) {
    append(js, kj::mv(field.name), kj::mv(field.value));
  }
}

Headers::Headers(jsg::Lock& js, const Headers& other): guard(Guard::NONE) {
  for (kj::uint i = 0; i < other.commonHeaders.size(); i++) {
    commonHeaders[i] =
        other.commonHeaders[i].map([](const kj::Own<Header>& h) { return h->clone(); });
  }
  uncommonHeaders.reserve(other.uncommonHeaders.size());
  for (auto& [key, header]: other.uncommonHeaders) {
    // It should not be possible to have duplicate keys here.
    uncommonHeaders.insert(kj::str(key), header->clone());
  }
}

Headers::Headers(jsg::Lock& js, const kj::HttpHeaders& other, Guard guard): guard(Guard::NONE) {
  // TODO(perf): Once kj::HttpHeaders supports an API for getting the CommonHeaderName directly
  // from the headers, we can optimize this to avoid looking up the common header IDs again,
  // making this constructor more efficient when copying common headers from kj::HttpHeaders.
  other.forEach([this, &js](auto name, auto value) {
    // We have to copy the strings here but we can avoid normalizing and validating since
    // they presumably already went through that process when they were added to the
    // kj::HttpHeader instance.
    appendUnguarded(js, kj::str(name), kj::str(value));
  });

  this->guard = guard;
}

kj::Maybe<Headers::Header&> Headers::tryGetHeader(const HeaderKey& key) {
  KJ_SWITCH_ONEOF(key) {
    KJ_CASE_ONEOF(idx, kj::uint) {
      return commonHeaders[idx].map([](kj::Own<Header>& header) -> Header& { return *header; });
    }
    KJ_CASE_ONEOF(name, kj::String) {
      return uncommonHeaders.find(name).map(
          [](kj::Own<Header>& header) -> Header& { return *header; });
    }
  }
  KJ_UNREACHABLE;
}

jsg::Ref<Headers> Headers::clone(jsg::Lock& js) const {
  auto result = js.alloc<Headers>(js, *this);
  result->guard = guard;
  return kj::mv(result);
}

// Fill in the given HttpHeaders with these headers. Note that strings are inserted by
// reference, so the output must be consumed immediately.
void Headers::shallowCopyTo(kj::HttpHeaders& out) {
  for (kj::uint i = 1; i < commonHeaders.size(); i++) {
    KJ_IF_SOME(header, commonHeaders[i]) {
      KJ_IF_SOME(name, header->name) {
        for (auto& value: header->values) {
          out.addPtrPtr(name, value);
        }
      } else {
        auto name = getCommonHeaderName(i);
        for (auto& value: header->values) {
          out.addPtrPtr(name, value);
        }
      }
    }
  }

  for (auto& header: uncommonHeaders) {
    KJ_IF_SOME(name, header.value->name) {
      for (auto& value: header.value->values) {
        out.addPtrPtr(name, value);
      }
    } else {
      for (auto& value: header.value->values) {
        out.addPtrPtr(header.key, value);
      }
    }
  }
}

kj::Array<Headers::DisplayedHeader> Headers::getDisplayedHeaders(jsg::Lock& js) {
  auto getSetCookie = FeatureFlags::get(js).getHttpHeadersGetSetCookie();

  size_t reserved = 0;

  for (kj::uint i = 1; i < commonHeaders.size(); i++) {
    KJ_IF_SOME(header, commonHeaders[i]) {
      if (getSetCookie && i == static_cast<uint>(capnp::CommonHeaderName::SET_COOKIE)) {
        reserved += header->values.size();
      } else {
        reserved += 1;
      }
    }
  }
  for (auto& header: uncommonHeaders) {
    reserved += header.value->values.size();
  }
  kj::Vector<Headers::DisplayedHeader> vec(reserved);

  for (kj::uint i = 1; i < commonHeaders.size(); i++) {
    auto name = getCommonHeaderName(i);
    KJ_IF_SOME(header, commonHeaders[i]) {
      if (getSetCookie && i == static_cast<uint>(capnp::CommonHeaderName::SET_COOKIE)) {
        for (auto& value: header->values) {
          vec.add(Headers::DisplayedHeader{
            .key = kj::str(name),
            .value = kj::str(value),
          });
        }
      } else {
        vec.add(Headers::DisplayedHeader{
          .key = kj::str(name),
          .value = kj::strArray(header->values, ", "),
        });
      }
    }
  }

  for (auto& header: uncommonHeaders) {
    vec.add(Headers::DisplayedHeader{
      .key = kj::str(header.key),
      .value = kj::strArray(header.value->values, ", "),
    });
  }

  auto ret = vec.releaseAsArray();
  std::sort(ret.begin(), ret.end(), [](const auto& a, const auto& b) { return a.key < b.key; });
  return kj::mv(ret);
}

jsg::Ref<Headers> Headers::constructor(jsg::Lock& js, jsg::Optional<Initializer> init) {
  using StringDict = jsg::Dict<kj::String, kj::String>;

  KJ_IF_SOME(i, init) {
    KJ_SWITCH_ONEOF(kj::mv(i)) {
      KJ_CASE_ONEOF(dict, StringDict) {
        return js.alloc<Headers>(js, kj::mv(dict));
      }
      KJ_CASE_ONEOF(headers, jsg::Ref<Headers>) {
        return js.alloc<Headers>(js, *headers);
        // It's important to note here that we are treating the Headers object
        // as a special case here. Per the fetch spec, we *should* be grabbing
        // the Symbol.iterator off the Headers object and interpreting it as
        // a Sequence<Sequence<kj::String>> (as in the StringPairs case
        // below). However, special casing Headers like we do here is more
        // performant and has other side effects such as preserving the casing
        // of header names that have been received.
        //
        // This does mean that we fail one of the more pathological (and kind
        // of weird) Web Platform Tests for this API:
        //
        //   const h = new Headers();
        //   h[Symbol.iterator] = function * () { yield ["test", "test"]; };
        //   const headers = new Headers(h);
        //   console.log(headers.has("test"));
        //
        // The spec would say headers.has("test") here should be true. With our
        // implementation here, however, we are ignoring the Symbol.iterator so
        // the test fails.
      }
      KJ_CASE_ONEOF(pairs, StringPairs) {
        auto dict = KJ_MAP(entry, pairs) {
          JSG_REQUIRE(entry.size() == 2, TypeError,
              "To initialize a Headers object from a sequence, each inner sequence "
              "must have exactly two elements.");
          return StringDict::Field{kj::mv(entry[0]), kj::mv(entry[1])};
        };
        return js.alloc<Headers>(js, StringDict{kj::mv(dict)});
      }
    }
  }

  return js.alloc<Headers>();
}

kj::Maybe<kj::String> Headers::get(jsg::Lock& js, kj::String name) {
  return getUnguarded(js, name);
}

kj::Maybe<kj::String> Headers::getUnguarded(jsg::Lock&, kj::StringPtr name) {
  return tryGetHeader(getHeaderKeyFor(name)).map([](Header& header) {
    return kj::strArray(header.values, ", ");
  });
}

kj::Maybe<kj::String> Headers::getCommon(jsg::Lock& js, capnp::CommonHeaderName idx) {
  kj::uint index = static_cast<kj::uint>(idx);
  KJ_DASSERT(index <= Headers::MAX_COMMON_HEADER_ID);
  return commonHeaders[index].map([](auto& header) { return kj::strArray(header->values, ", "); });
}

kj::Array<kj::StringPtr> Headers::getSetCookie() {
  auto& header = commonHeaders[static_cast<kj::uint>(capnp::CommonHeaderName::SET_COOKIE)];
  KJ_IF_SOME(h, header) {
    return KJ_MAP(value, h->values) { return value.asPtr(); };
  }
  return nullptr;
}

kj::Array<kj::StringPtr> Headers::getAll(kj::String name) {
  if (!strcaseeq(name, "set-cookie"_kj)) {
    JSG_FAIL_REQUIRE(TypeError, "getAll() can only be used with the header name \"Set-Cookie\".");
  }

  // getSetCookie() is the standard API here. getAll(...) is our legacy non-standard extension
  // for the same use case. We continue to support getAll for backwards compatibility but moving
  // forward users really should be using getSetCookie.
  return getSetCookie();
}

bool Headers::has(kj::String name) {
  return tryGetHeader(getHeaderKeyFor(name)) != kj::none;
}

bool Headers::hasCommon(capnp::CommonHeaderName idx) {
  kj::uint index = static_cast<kj::uint>(idx);
  KJ_DASSERT(index <= Headers::MAX_COMMON_HEADER_ID);
  return commonHeaders[index] != kj::none;
}

void Headers::set(jsg::Lock& js, kj::String name, kj::String value) {
  checkGuard();
  setUnguarded(js, kj::mv(name), normalizeHeaderValue(kj::mv(value)));
}

void Headers::setUnguarded(jsg::Lock& js, kj::String name, kj::String value) {
  KJ_SWITCH_ONEOF(getHeaderKeyFor(name)) {
    KJ_CASE_ONEOF(id, kj::uint) {
      KJ_IF_SOME(existing, commonHeaders[id]) {
        existing->values.resize(1);
        existing->values[0] = kj::mv(value);
      } else {
        auto& created = commonHeaders[id].emplace(kj::heap(Header()));
        if (name != getCommonHeaderName(id)) {
          created->name = kj::mv(name);
        }
        created->values.resize(1);
        created->values[0] = kj::mv(value);
      }
      return;
    }
    KJ_CASE_ONEOF(n, kj::String) {
      using Ret = typename decltype(uncommonHeaders)::Entry;
      auto& header = uncommonHeaders.findOrCreate(n, [&] -> Ret {
        kj::Maybe<kj::String> maybeName;
        if (name != n) maybeName = kj::mv(name);
        return Ret{
          .key = kj::mv(n),
          .value = kj::heap(Header(kj::mv(maybeName))),
        };
      });
      header->values.resize(1);
      header->values[0] = kj::mv(value);
      return;
    }
  }
  KJ_UNREACHABLE;
}

void Headers::setCommon(capnp::CommonHeaderName idx, kj::String value) {
  kj::uint index = static_cast<kj::uint>(idx);
  KJ_DASSERT(index <= Headers::MAX_COMMON_HEADER_ID);
  KJ_IF_SOME(existing, commonHeaders[index]) {
    existing->values.resize(1);
    existing->values[0] = kj::mv(value);
  } else {
    auto& created = commonHeaders[index].emplace(kj::heap(Header()));
    created->values.resize(1);
    created->values[0] = kj::mv(value);
  }
}

void Headers::append(jsg::Lock& js, kj::String name, kj::String value) {
  checkGuard();
  appendUnguarded(js, kj::mv(name), normalizeHeaderValue(kj::mv(value)));
}

void Headers::appendUnguarded(jsg::Lock& js, kj::String name, kj::String value) {
  KJ_SWITCH_ONEOF(getHeaderKeyFor(name)) {
    KJ_CASE_ONEOF(id, kj::uint) {
      KJ_IF_SOME(existing, commonHeaders[id]) {
        existing->values.add(kj::mv(value));
      } else {
        auto& created = commonHeaders[id].emplace(kj::heap(Header()));
        if (name != getCommonHeaderName(id)) {
          created->name = kj::mv(name);
        }
        created->values.resize(1);
        created->values[0] = kj::mv(value);
      }
      return;
    }
    KJ_CASE_ONEOF(n, kj::String) {
      KJ_IF_SOME(existing, uncommonHeaders.find(n)) {
        existing->values.add(kj::mv(value));
      } else {
        using Ret = typename decltype(uncommonHeaders)::Entry;
        auto& header = uncommonHeaders.findOrCreate(n, [&] -> Ret {
          kj::Maybe<kj::String> maybeName;
          if (name != n) maybeName = kj::mv(name);
          return Ret{
            .key = kj::mv(n),
            .value = kj::heap(Header(kj::mv(maybeName))),
          };
        });
        header->values.add(kj::mv(value));
      }
      return;
    }
  }
  KJ_UNREACHABLE;
}

void Headers::delete_(kj::String name) {
  checkGuard();
  KJ_SWITCH_ONEOF(getHeaderKeyFor(name)) {
    KJ_CASE_ONEOF(id, kj::uint) {
      commonHeaders[id] = kj::none;
      return;
    }
    KJ_CASE_ONEOF(n, kj::String) {
      uncommonHeaders.erase(n);
      return;
    }
  }
  KJ_UNREACHABLE;
}

void Headers::deleteCommon(capnp::CommonHeaderName idx) {
  kj::uint index = static_cast<kj::uint>(idx);
  KJ_DASSERT(index <= Headers::MAX_COMMON_HEADER_ID);
  commonHeaders[index] = kj::none;
}

// There are a couple implementation details of the Headers iterators worth calling out.
//
// 1. Each iterator gets its own copy of the keys and/or values of the headers. While nauseating
//    from a performance perspective, this solves both the iterator -> iterable lifetime dependence
//    and the iterator invalidation issue: i.e., it's impossible for a user to unsafely modify the
//    Headers data structure while iterating over it, because they are simply two separate data
//    structures. By empirical testing, this seems to be how Chrome implements Headers iteration.
//
//    Other alternatives bring their own pitfalls. We could store a Ref of the parent Headers
//    object, solving the lifetime issue. To solve the iterator invalidation issue, we could store a
//    copy of the currently-iterated-over key and use std::upper_bound() to find the next entry
//    every time we want to increment the iterator (making the increment operation O(lg n) rather
//    than O(1)); or we could make each Header entry in the map store a set of back-pointers to all
//    live iterators pointing to it, with delete_() incrementing all iterators in the set whenever
//    it deletes a header entry. Neither hack appealed to me.
//
// 2. Notice that the next() member function of the iterator classes moves the string(s) they
//    contain, rather than making a copy of them as in the FormData iterators. This is safe to do
//    because, unlike FormData, these iterators have their own copies of the strings, and since they
//    are forward-only iterators, we know we won't need the strings again.
//
// TODO(perf): On point 1, perhaps we could avoid most copies by using a copy-on-write strategy
//   applied to the header map elements? We'd still copy the whole data structure to avoid iterator
//   invalidation, but the elements would be cheaper to copy.

jsg::Ref<Headers::EntryIterator> Headers::entries(jsg::Lock& js) {
  return js.alloc<EntryIterator>(IteratorState<DisplayedHeader>{getDisplayedHeaders(js)});
}
jsg::Ref<Headers::KeyIterator> Headers::keys(jsg::Lock& js) {
  auto headers = getDisplayedHeaders(js);
  kj::Vector<kj::String> keys(headers.size());
  for (auto& header: headers) {
    keys.add(kj::mv(header.key));
  };
  return js.alloc<KeyIterator>(IteratorState<kj::String>(keys.releaseAsArray()));
}
jsg::Ref<Headers::ValueIterator> Headers::values(jsg::Lock& js) {
  // Annoyingly, the spec requires that the values iterator still be sorted by key.
  // To make this easiest, let's grab the displayed headers and then extract the values.
  // the getDisplayedHeaders() function does the sorting for us at the cost of an extra
  // copy of the names. Fortunately, enumerating by value is likely way less common than
  // other forms of iteration so the cost should be acceptable.
  auto headers = getDisplayedHeaders(js);
  kj::Vector<kj::String> values(headers.size());
  for (auto& header: headers) {
    values.add(kj::mv(header.value));
  };
  return js.alloc<ValueIterator>(IteratorState<kj::String>(values.releaseAsArray()));
}

void Headers::forEach(jsg::Lock& js,
    jsg::Function<void(kj::StringPtr, kj::StringPtr, jsg::Ref<Headers>)> callback,
    jsg::Optional<jsg::Value> thisArg) {
  auto receiver = js.v8Undefined();
  KJ_IF_SOME(arg, thisArg) {
    auto handle = arg.getHandle(js);
    if (!handle->IsNullOrUndefined()) {
      receiver = handle;
    }
  }
  callback.setReceiver(js.v8Ref(receiver));

  for (auto& entry: getDisplayedHeaders(js)) {
    callback(js, entry.value, entry.key, JSG_THIS);
  }
}

bool Headers::inspectImmutable() {
  return guard != Guard::NONE;
}

void Headers::visitForMemoryInfo(jsg::MemoryTracker& tracker) const {
  for (const auto& header: commonHeaders) {
    tracker.trackField("header", header);
  }
  for (const auto& header: uncommonHeaders) {
    tracker.trackField(nullptr, header.value);
  }
}

// -----------------------------------------------------------------------------
// serialization of headers
//
// http-over-capnp.capnp has a nice list of common header names, taken from the HTTP/2 standard.
// We'll use it as an optimization.
//
// Note that using numeric IDs for headers implies we lose the original capitalization. However,
// the JS Headers API doesn't actually give the application any way to observe the capitalization
// of header names -- it only becomes relevant when serializing over HTTP/1.1. And at that point,
// we are actually free to change the capitalization anyway, and we commonly do (KJ itself will
// normalize capitalization of all registered headers, and http-over-capnp also loses
// capitalization). So, it's certainly not worth it to try to keep the original capitalization
// across serialization.

void Headers::serialize(jsg::Lock& js, jsg::Serializer& serializer) {
  // We serialize as a series of key-value pairs. Each value is a length-delimited string. Each key
  // is a common header ID, or the value zero to indicate an uncommon header, which is then
  // followed by a length-delimited name.

  serializer.writeRawUint32(static_cast<uint>(guard));

  // Write the count of headers.
  uint count = 0;
  for (auto& header: commonHeaders) {
    KJ_IF_SOME(h, header) {
      count += h->values.size();
    }
  }
  for (auto& header: uncommonHeaders) {
    count += header.value->values.size();
  }
  serializer.writeRawUint32(count);

  // Now write key/values.
  for (kj::uint i = 1; i < commonHeaders.size(); i++) {
    KJ_IF_SOME(header, commonHeaders[i]) {
      for (auto& value: header->values) {
        serializer.writeRawUint32(i);
        serializer.writeLengthDelimited(value);
      }
    }
  }
  for (auto& header: uncommonHeaders) {
    auto name = ([&] -> kj::StringPtr {
      KJ_IF_SOME(name, header.value->name) {
        return name;
      } else {
        return header.key;
      }
    })();
    for (auto& value: header.value->values) {
      serializer.writeRawUint32(0);
      serializer.writeLengthDelimited(name);
      serializer.writeLengthDelimited(value);
    }
  }
}

jsg::Ref<Headers> Headers::deserialize(
    jsg::Lock& js, rpc::SerializationTag tag, jsg::Deserializer& deserializer) {
  auto result = js.alloc<Headers>();
  uint guard = deserializer.readRawUint32();
  KJ_REQUIRE(guard <= static_cast<uint>(Guard::NONE), "unknown guard value");

  uint count = deserializer.readRawUint32();

  for (auto i KJ_UNUSED: kj::zeroTo(count)) {
    uint commonId = deserializer.readRawUint32();
    kj::String name;
    if (commonId == 0) {
      name = deserializer.readLengthDelimitedString();
    } else {
      KJ_ASSERT(commonId <= Headers::MAX_COMMON_HEADER_ID);
      name = kj::str(getCommonHeaderName(commonId));
    }

    auto value = deserializer.readLengthDelimitedString();

    // TODO(performance): We can avoid some copies here by constructing the
    // the Header entry directly using information from the deserializer
    // directly without relying on append.
    result->appendUnguarded(js, kj::mv(name), kj::mv(value));
  }

  // Don't actually set the guard until here because it may block the ability to call `append()`.
  result->guard = static_cast<Guard>(guard);

  return result;
}

}  // namespace workerd::api
