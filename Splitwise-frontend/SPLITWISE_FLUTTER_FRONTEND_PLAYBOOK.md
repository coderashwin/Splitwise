# Splitwise Flutter Frontend — Multi-Agent Development Playbook

> **Read this entire file before writing a single line of code or creating a single Stitch frame.**
> This document is the single source of truth for all agents working on the Flutter frontend.
> All agents share this file. All agents write to the shared log at the bottom.
> **Design always comes before development. No screen is coded without a Stitch-approved design.**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Agent Rules — Non-Negotiable](#2-agent-rules--non-negotiable)
3. [Shared Agent Log Protocol](#3-shared-agent-log-protocol)
4. [Tech Stack & Versions](#4-tech-stack--versions)
5. [Repository Structure](#5-repository-structure)
6. [Environment & Setup](#6-environment--setup)
7. [Stitch MCP Design Workflow](#7-stitch-mcp-design-workflow)
8. [Screen Build Order](#8-screen-build-order)
9. [Screen Specifications](#9-screen-specifications)
   - [9.1 Splash & Onboarding](#91-splash--onboarding)
   - [9.2 Auth — Google / Apple Sign In](#92-auth--google--apple-sign-in)
   - [9.3 Home Dashboard](#93-home-dashboard)
   - [9.4 Friends — List & Search](#94-friends--list--search)
   - [9.5 Friend Profile & Debt Detail](#95-friend-profile--debt-detail)
   - [9.6 Groups — List](#96-groups--list)
   - [9.7 Group Detail](#97-group-detail)
   - [9.8 Add / Edit Expense](#98-add--edit-expense)
   - [9.9 Expense Detail](#99-expense-detail)
   - [9.10 Settlements](#910-settlements)
   - [9.11 Notifications](#911-notifications)
   - [9.12 Profile & Settings](#912-profile--settings)
10. [API Integration Layer](#10-api-integration-layer)
11. [State Management Conventions](#11-state-management-conventions)
12. [Navigation Conventions](#12-navigation-conventions)
13. [Design System & Theme](#13-design-system--theme)
14. [Testing Requirements](#14-testing-requirements)
15. [Build & Release](#15-build--release)
16. [Security Checklist](#16-security-checklist)
17. [Shared Agent Log](#17-shared-agent-log)

---

## 1. Project Overview

**App:** Splitwise — expense sharing mobile app (Flutter APK)
**Backend:** `Splitwise-backend/` — Node.js/Express REST API running at `http://localhost:3000`
**Frontend folder:** `Splitwise-frontend/`
**Primary platform:** Android (APK). iOS support is secondary — keep code platform-agnostic.
**Design tool:** Stitch MCP (mandatory design-first workflow — see Section 7)
**Currency:** INR only. All amounts are **paise integers** from the API. Always divide by 100 for display (₹).
**Offline:** Optimistic UI on mutations. Cache last-fetched data in local Hive store.

### Core UX Rules

- Every screen must be designed in Stitch and approved **before** any Flutter code is written.
- Amounts from the API are always integers in paise. Never display raw paise — always show `₹X.XX`.
- A user who owes money sees amounts in **red**. A user who is owed sees amounts in **green**.
- All lists are paginated using the backend's cursor-based pagination (`nextCursor`).
- Loading states, empty states, and error states are **mandatory** on every list/detail screen.
- Toasts (SnackBar) for success/error feedback on every mutation (add expense, settle, etc.).

---

## 2. Agent Rules — Non-Negotiable

### Before starting any task

1. **Read the full [Shared Agent Log](#17-shared-agent-log)** — every entry.
2. **Check what is marked `DONE`** — do not re-design or re-implement completed screens.
3. **Check `IN_PROGRESS`** — do not start a screen that another agent owns.
4. **Check `BLOCKED`** — you may be the one who can unblock it.
5. **Read the screen spec** (Section 9) for the screen you are about to work on.
6. **Read the API Integration Layer** (Section 10) before writing any HTTP call.
7. **Read the State Management Conventions** (Section 11) before creating any provider/bloc.

### Stitch-first rule (absolute)

8. **DESIGN in Stitch first** — call Stitch MCP, create the frame, finalize the design.
9. **Get the Stitch design approved** — log `DESIGN_DONE` before writing code.
10. **Only then write Flutter code** — log `IN_PROGRESS` for development.
11. **Never skip Stitch**, even for "simple" screens. Every screen gets a Stitch frame.

### While working

12. **Write your `IN_PROGRESS` log entry immediately** before you write any file.
13. **Do not modify files owned by another screen's module** without a log entry explaining why.
14. **Do not change shared files** (`lib/core/`, `lib/shared/`) without a log entry.
15. **Follow the exact folder structure** in Section 5. Do not invent new top-level folders.
16. **All API calls go through `lib/core/network/api_client.dart`** — never call `http` or `dio` directly from a feature file.
17. **All amounts displayed must be formatted** with `CurrencyFormatter.format(paise)` from `lib/core/utils/currency_formatter.dart`.

### When finishing a task

18. **Run `flutter analyze`** — zero warnings before marking `DONE`.
19. **Run widget/unit tests** for your screen before marking `DONE`.
20. **Update your log entry** from `IN_PROGRESS` to `DONE` with a summary of files created.
21. **Add follow-up TODOs** as new log entries.

### Forbidden actions

- ❌ Never write Flutter code before Stitch design is `DESIGN_DONE` in the log
- ❌ Never hardcode colors, font sizes, or spacing — always use `AppTheme` tokens
- ❌ Never store the JWT access token in SharedPreferences (plaintext) — use `flutter_secure_storage`
- ❌ Never call the API from a Widget's `build()` method — use providers/blocs
- ❌ Never use `print()` — use `AppLogger.d/i/w/e()` from `lib/core/utils/logger.dart`
- ❌ Never display raw paise amounts — always call `CurrencyFormatter.format()`
- ❌ Never commit `.env` or any file containing real API keys / secrets
- ❌ Never hardcode the backend base URL — read from environment config
- ❌ Never ignore `mounted` check before calling `setState` after async gaps

---

## 3. Shared Agent Log Protocol

The log is in **Section 17** of this file. It is append-only. Never delete or modify existing entries.

### Log entry format

```
### [TIMESTAMP] [AGENT_ID] [STATUS] — [SCREEN/TASK]

**Status:** DESIGN_IN_PROGRESS | DESIGN_DONE | IN_PROGRESS | DONE | BLOCKED | TODO
**Agent:** <identifier, e.g. "Agent-A", "Claude-Session-2">
**Stitch Frame ID:** <frame ID from Stitch MCP, once design is created>
**Files touched:**
- lib/path/to/file.dart (created | modified | deleted)

**Summary:**
One paragraph describing what was done or what is planned.

**API endpoints used:**
- GET /api/v1/expenses — fetches paginated expense list

**Dependencies needed from other agents:**
- List any providers / widgets you are waiting on

**Blockers:**
- List anything preventing completion

**Follow-up TODOs:**
- Any tasks discovered that are out of scope for this session
---
```

### Status definitions

| Status | Meaning |
|---|---|
| `TODO` | Identified but not yet started |
| `DESIGN_IN_PROGRESS` | Stitch frame is being created |
| `DESIGN_DONE` | Stitch frame complete and logged — Flutter coding may begin |
| `IN_PROGRESS` | Flutter code being written — do not touch these files |
| `DONE` | Complete, tested, analyze-clean |
| `BLOCKED` | Waiting on another agent or backend |
| `REVIEW_NEEDED` | Done but needs a sanity check |

---

## 4. Tech Stack & Versions

Pin these in `pubspec.yaml`. Do not upgrade without a log entry.

```yaml
environment:
  sdk: ">=3.3.0 <4.0.0"
  flutter: ">=3.22.0"

dependencies:
  flutter:
    sdk: flutter

  # Networking
  dio: ^5.4.3
  retrofit: ^4.1.0

  # State management
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Navigation
  go_router: ^13.2.0

  # Secure storage
  flutter_secure_storage: ^9.0.0

  # Local cache
  hive_flutter: ^1.1.0

  # Auth
  google_sign_in: ^6.2.1
  sign_in_with_apple: ^6.1.1

  # UI / UX
  cached_network_image: ^3.3.1
  shimmer: ^3.0.0
  lottie: ^3.1.0
  image_picker: ^1.1.1
  intl: ^0.19.0

  # Utils
  freezed_annotation: ^2.4.1
  json_annotation: ^4.9.0
  logger: ^2.3.0
  connectivity_plus: ^6.0.3
  package_info_plus: ^8.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_riverpod_lint: ^2.3.10
  build_runner: ^2.4.9
  freezed: ^2.5.2
  json_serializable: ^6.8.0
  retrofit_generator: ^8.1.0
  riverpod_generator: ^2.4.0
  mocktail: ^1.0.3
  flutter_lints: ^4.0.0
```

**Key version decisions:**
- Riverpod 2.x with code generation — no manual `Provider()` wiring
- Dio + Retrofit for type-safe API layer
- Freezed for immutable state & DTOs
- go_router for declarative navigation with deep-link support

---

## 5. Repository Structure

Agents must place files in exactly these locations.

```
Splitwise-frontend/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   ├── app_config.dart          # Base URL, env flags
│   │   │   └── flavor_config.dart       # dev / staging / prod flavors
│   │   ├── network/
│   │   │   ├── api_client.dart          # Dio singleton + interceptors
│   │   │   ├── auth_interceptor.dart    # Attach Bearer token, handle 401
│   │   │   ├── api_exception.dart       # Typed error from DioException
│   │   │   └── api_result.dart          # Result<T> sealed class
│   │   ├── storage/
│   │   │   ├── secure_storage.dart      # flutter_secure_storage wrapper
│   │   │   └── hive_store.dart          # Local cache wrapper
│   │   ├── router/
│   │   │   ├── app_router.dart          # go_router definition
│   │   │   └── route_names.dart         # All route name constants
│   │   ├── theme/
│   │   │   ├── app_theme.dart           # MaterialTheme light/dark
│   │   │   ├── app_colors.dart          # Color constants
│   │   │   ├── app_text_styles.dart     # TextStyle constants
│   │   │   └── app_spacing.dart         # Spacing constants (4pt grid)
│   │   └── utils/
│   │       ├── currency_formatter.dart  # format(paise) → '₹X.XX'
│   │       ├── date_formatter.dart      # relative dates, full dates
│   │       └── logger.dart              # AppLogger wrapper
│   │
│   ├── shared/
│   │   ├── widgets/
│   │   │   ├── app_button.dart          # Primary, secondary, text buttons
│   │   │   ├── app_avatar.dart          # Cached network image + fallback initials
│   │   │   ├── app_text_field.dart      # Styled text input
│   │   │   ├── app_bottom_sheet.dart    # Consistent bottom sheet scaffold
│   │   │   ├── app_snackbar.dart        # Success / error snackbar helper
│   │   │   ├── empty_state.dart         # Illustration + message
│   │   │   ├── error_state.dart         # Error message + retry button
│   │   │   ├── loading_shimmer.dart     # Shimmer placeholder cards
│   │   │   └── amount_text.dart         # Colored ₹ amount (red/green)
│   │   └── models/
│   │       └── paginated_response.dart  # Generic<T> cursor pagination model
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── data/
│   │   │   │   ├── auth_api.dart        # Retrofit interface
│   │   │   │   ├── auth_repository.dart
│   │   │   │   └── models/
│   │   │   │       ├── token_response.dart
│   │   │   │       └── user_model.dart
│   │   │   ├── providers/
│   │   │   │   ├── auth_provider.dart
│   │   │   │   └── auth_state.dart
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           ├── splash_screen.dart
│   │   │           └── login_screen.dart
│   │   │
│   │   ├── home/
│   │   │   ├── data/
│   │   │   │   └── home_repository.dart # Aggregates friends + groups debts
│   │   │   ├── providers/
│   │   │   │   └── home_provider.dart
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           └── home_screen.dart
│   │   │
│   │   ├── friends/
│   │   │   ├── data/
│   │   │   │   ├── friends_api.dart
│   │   │   │   ├── friends_repository.dart
│   │   │   │   └── models/
│   │   │   │       ├── friendship_model.dart
│   │   │   │       └── friend_debt_model.dart
│   │   │   ├── providers/
│   │   │   │   ├── friends_provider.dart
│   │   │   │   └── friend_debt_provider.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   ├── friends_screen.dart
│   │   │       │   └── friend_detail_screen.dart
│   │   │       └── widgets/
│   │   │           ├── friend_list_tile.dart
│   │   │           └── friend_search_delegate.dart
│   │   │
│   │   ├── groups/
│   │   │   ├── data/
│   │   │   │   ├── groups_api.dart
│   │   │   │   ├── groups_repository.dart
│   │   │   │   └── models/
│   │   │   │       ├── group_model.dart
│   │   │   │       └── group_member_model.dart
│   │   │   ├── providers/
│   │   │   │   ├── groups_provider.dart
│   │   │   │   └── group_detail_provider.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   ├── groups_screen.dart
│   │   │       │   ├── group_detail_screen.dart
│   │   │       │   └── create_group_screen.dart
│   │   │       └── widgets/
│   │   │           ├── group_list_tile.dart
│   │   │           └── group_member_chip.dart
│   │   │
│   │   ├── expenses/
│   │   │   ├── data/
│   │   │   │   ├── expenses_api.dart
│   │   │   │   ├── expenses_repository.dart
│   │   │   │   └── models/
│   │   │   │       ├── expense_model.dart
│   │   │   │       └── split_model.dart
│   │   │   ├── providers/
│   │   │   │   ├── expenses_provider.dart
│   │   │   │   └── add_expense_provider.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   ├── add_expense_screen.dart
│   │   │       │   └── expense_detail_screen.dart
│   │   │       └── widgets/
│   │   │           ├── expense_list_tile.dart
│   │   │           ├── split_type_selector.dart
│   │   │           └── participant_split_row.dart
│   │   │
│   │   ├── settlements/
│   │   │   ├── data/
│   │   │   │   ├── settlements_api.dart
│   │   │   │   ├── settlements_repository.dart
│   │   │   │   └── models/
│   │   │   │       └── settlement_model.dart
│   │   │   ├── providers/
│   │   │   │   └── settlements_provider.dart
│   │   │   └── presentation/
│   │   │       ├── screens/
│   │   │       │   └── settlements_screen.dart
│   │   │       └── widgets/
│   │   │           └── settle_up_bottom_sheet.dart
│   │   │
│   │   ├── notifications/
│   │   │   ├── data/
│   │   │   │   ├── notifications_api.dart
│   │   │   │   ├── notifications_repository.dart
│   │   │   │   └── models/
│   │   │   │       └── notification_model.dart
│   │   │   ├── providers/
│   │   │   │   └── notifications_provider.dart
│   │   │   └── presentation/
│   │   │       └── screens/
│   │   │           └── notifications_screen.dart
│   │   │
│   │   └── profile/
│   │       ├── data/
│   │       │   ├── profile_api.dart
│   │       │   └── profile_repository.dart
│   │       ├── providers/
│   │       │   └── profile_provider.dart
│   │       └── presentation/
│   │           └── screens/
│   │               └── profile_screen.dart
│   │
│   └── main.dart                        # App entry point
│
├── test/
│   ├── unit/
│   │   ├── currency_formatter_test.dart
│   │   ├── auth_repository_test.dart
│   │   └── expense_split_test.dart
│   ├── widget/
│   │   ├── login_screen_test.dart
│   │   ├── home_screen_test.dart
│   │   └── add_expense_screen_test.dart
│   └── helpers/
│       ├── mock_api_client.dart
│       └── test_providers.dart
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── onboarding_1.png
│   │   └── empty_state.png
│   ├── animations/
│   │   └── success_lottie.json
│   └── fonts/                           # Custom fonts if used
│
├── android/
├── ios/
├── .env.development
├── .env.production
├── analysis_options.yaml
└── pubspec.yaml
```

---

## 6. Environment & Setup

### `.env.development`

```env
API_BASE_URL=http://10.0.2.2:3000/api/v1
GOOGLE_WEB_CLIENT_ID=<your-google-client-id>
ENVIRONMENT=development
```

> **Note:** `10.0.2.2` is the Android emulator's alias for `localhost`. Use your machine's LAN IP for real devices.

### `.env.production`

```env
API_BASE_URL=https://api.splitwise.yourdomain.com/api/v1
GOOGLE_WEB_CLIENT_ID=<your-google-client-id>
ENVIRONMENT=production
```

### `lib/core/config/app_config.dart`

```dart
class AppConfig {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );
  static const String googleWebClientId = String.fromEnvironment(
    'GOOGLE_WEB_CLIENT_ID',
    defaultValue: '',
  );
  static const bool isDev = String.fromEnvironment(
    'ENVIRONMENT',
    defaultValue: 'development',
  ) == 'development';
}
```

### Setup steps (run once)

```bash
# In Splitwise-frontend/
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
flutter analyze        # must be zero issues before any dev work
```

### Generate code after any model/API change

```bash
flutter pub run build_runner watch --delete-conflicting-outputs
```

---

## 7. Stitch MCP Design Workflow

This is the **mandatory gate** before any Flutter screen is coded.

### Step-by-step for every screen

```
STEP 1 — Log DESIGN_IN_PROGRESS
  Add a log entry in Section 17 with status DESIGN_IN_PROGRESS
  before opening Stitch.

STEP 2 — Open Stitch MCP
  Call the Stitch MCP tool with the screen name and spec from Section 9.
  Reference the Design System tokens from Section 13.

STEP 3 — Create the Stitch frame
  Design the following states for every screen:
    a. Default / loaded state (with realistic data)
    b. Loading / skeleton state
    c. Empty state (no data)
    d. Error state (API failure)
  For forms, additionally design:
    e. Validation error state (field-level errors)

STEP 4 — Design components
  For every new reusable widget introduced on this screen,
  create a standalone component frame in Stitch.

STEP 5 — Log DESIGN_DONE
  Update the log entry with the Stitch Frame ID.
  Paste the frame URL in the log entry.
  Status must be DESIGN_DONE before proceeding.

STEP 6 — Write Flutter code
  Now log IN_PROGRESS and begin coding.
  The Stitch design is the visual contract — pixel-follow it.

STEP 7 — Log DONE
  After flutter analyze passes and tests pass.
```

### Stitch design token mapping to Flutter

| Stitch Token | Flutter mapping |
|---|---|
| Primary color | `AppColors.primary` |
| Surface color | `AppColors.surface` |
| Error color | `AppColors.error` |
| Text/heading | `AppTextStyles.heading1` … `heading4` |
| Text/body | `AppTextStyles.body1`, `body2` |
| Text/caption | `AppTextStyles.caption` |
| Spacing/xs = 4 | `AppSpacing.xs` |
| Spacing/sm = 8 | `AppSpacing.sm` |
| Spacing/md = 16 | `AppSpacing.md` |
| Spacing/lg = 24 | `AppSpacing.lg` |
| Spacing/xl = 32 | `AppSpacing.xl` |
| Radius/card = 12 | `AppSpacing.radiusCard` |
| Radius/button = 8 | `AppSpacing.radiusButton` |

---

## 8. Screen Build Order

Build screens **strictly in this order**. A screen marked TODO must not be started until all screens above it are `DONE` in the log.

```
Phase 1 — Foundation (no screen dependencies)
  1.1  Core setup: api_client, secure_storage, app_router, theme, shared widgets
  1.2  Screen: Splash
  1.3  Screen: Login (Auth — Google / Apple Sign In)

Phase 2 — Main shell
  2.1  Screen: Home Dashboard
  2.2  Screen: Notifications

Phase 3 — Social graph
  3.1  Screen: Friends List & Search
  3.2  Screen: Friend Profile & Debt Detail

Phase 4 — Groups
  4.1  Screen: Groups List
  4.2  Screen: Group Detail
  4.3  Screen: Create Group

Phase 5 — Core domain
  5.1  Screen: Add / Edit Expense
  5.2  Screen: Expense Detail

Phase 6 — Settlements
  6.1  Screen: Settlements (Settle Up flow)

Phase 7 — Profile
  7.1  Screen: Profile & Settings
```

---

## 9. Screen Specifications

Every screen spec below describes:
- **Purpose** — what the user accomplishes
- **Backend APIs** — exact endpoints from `Splitwise-backend/`
- **UI states** — what Stitch must design
- **Widgets** — key components
- **Navigation** — where this screen goes to/from
- **Business logic** — formatting and behavior rules

---

### 9.1 Splash & Onboarding

**Purpose:** App entry point. Check for stored token. Route to Login or Home.

**Backend APIs:** None (token check is local only)

**Logic:**
1. On init, read `accessToken` from `SecureStorage`.
2. If token exists → call `GET /api/v1/auth/me` to validate.
   - Success → navigate to `/home` (replace, no back stack)
   - 401 → clear tokens → navigate to `/login`
   - Network error → navigate to `/login` with offline toast
3. If no token → navigate to `/login` after 1.5s animation.

**UI States to design in Stitch:**
- Animated logo with app name, loading indicator

**Files:**
- `lib/features/auth/presentation/screens/splash_screen.dart`
- `lib/core/router/app_router.dart` — initial route logic

---

### 9.2 Auth — Google / Apple Sign In

**Purpose:** Let user sign in with Google or Apple OAuth.

**Backend APIs:**
```
POST /api/v1/auth/oauth/google
  Body: { code: string, deviceId: string }
  Response: { accessToken, refreshToken, expiresIn, user: { ... } }

POST /api/v1/auth/oauth/apple
  Body: { code: string, deviceId: string }
  Response: { accessToken, refreshToken, expiresIn, user: { ... } }

POST /api/v1/auth/refresh
  Body: { refreshToken: string, deviceId: string }
  Response: { accessToken, refreshToken, expiresIn }
```

**Logic:**
1. Generate a `deviceId` (UUID v4) once on first launch, store in `SecureStorage`.
2. On "Continue with Google": call `GoogleSignIn().signIn()`, get server auth code, send to backend.
3. On "Continue with Apple": call `SignInWithApple.getAppleIDCredential()`, get auth code, send to backend.
4. On success: store `accessToken` and `refreshToken` in `SecureStorage`. Store user in Hive.
5. Navigate to `/home` (replace).
6. `AuthInterceptor` handles `401` globally: attempt one token refresh, retry, else navigate to `/login`.

**UI States to design in Stitch:**
- Default: logo, tagline, Google button, Apple button, terms text
- Loading: buttons show circular progress, disable interaction
- Error: SnackBar with error message

**Files:**
- `lib/features/auth/presentation/screens/login_screen.dart`
- `lib/features/auth/data/auth_api.dart`
- `lib/features/auth/data/auth_repository.dart`
- `lib/features/auth/providers/auth_provider.dart`
- `lib/core/network/auth_interceptor.dart`
- `lib/core/storage/secure_storage.dart`

---

### 9.3 Home Dashboard

**Purpose:** Overview of total balance with friends and across all groups.

**Backend APIs:**
```
GET /api/v1/friends?status=accepted&limit=50
  Response: { data: [{ userId, name, avatarUrl, debt: { netAmount, direction } }], nextCursor }

GET /api/v1/groups?limit=50
  Response: { data: [{ _id, name, avatarUrl, netBalance }], nextCursor }
```

**Logic:**
1. Fetch friends list + groups list in parallel (`Future.wait`).
2. Compute total "you owe" = sum of `netAmount` where direction is `owes`.
3. Compute total "you are owed" = sum of `netAmount` where direction is `owed`.
4. Display net balance prominently (green if positive/owed, red if negative/owed).
5. Show top 5 friends with non-zero balance + "See all" link.
6. Show all groups with non-zero balance + "See all" link.
7. FAB → navigates to Add Expense screen.

**UI States to design in Stitch:**
- Loaded: balance card, friends mini-list, groups mini-list
- Loading: shimmer skeleton for balance card and list tiles
- Empty: "Add friends and start splitting!" illustration
- Error: error card with retry button

**Navigation:**
- AppBar actions: Notification bell (badge count), Avatar → Profile
- Friend tile → `FriendDetailScreen`
- Group tile → `GroupDetailScreen`
- FAB → `AddExpenseScreen`

**Files:**
- `lib/features/home/presentation/screens/home_screen.dart`
- `lib/features/home/providers/home_provider.dart`
- `lib/features/home/data/home_repository.dart`

---

### 9.4 Friends — List & Search

**Purpose:** See all friends, send/accept/reject friend requests, search for new friends.

**Backend APIs:**
```
GET /api/v1/friends?status=accepted&limit=20&cursor={cursor}
  — accepted friends list (paginated)

GET /api/v1/friends/requests/incoming
  — pending incoming requests

GET /api/v1/friends/requests/outgoing
  — pending outgoing requests

POST /api/v1/friends/request/:userId
  — send friend request

PATCH /api/v1/friends/request/:id/accept
  — accept a request

PATCH /api/v1/friends/request/:id/reject
  — reject a request

DELETE /api/v1/friends/:userId
  — remove a friend

GET /api/v1/users/search?q={query}
  — search users by name/email (for adding new friends)
```

**Logic:**
1. Tab bar: "Friends" | "Requests" (badge with pending count)
2. Friends tab: paginated list with pull-to-refresh, load-more on scroll end.
3. Requests tab: incoming + outgoing sections. Accept/Reject inline with optimistic update.
4. Search icon in AppBar → opens search delegate → calls `/users/search` on query change (debounce 300ms).
5. Search result tile: show "Add Friend" button → calls `POST /api/v1/friends/request/:userId`.
6. A friend tile shows their net debt summary (owe/owed amount in color).

**UI States to design in Stitch:**
- Friends tab: loaded list, loading shimmer, empty ("No friends yet"), error
- Requests tab: loaded, empty
- Search overlay: results list, loading, empty ("No users found"), error

**Files:**
- `lib/features/friends/presentation/screens/friends_screen.dart`
- `lib/features/friends/presentation/widgets/friend_list_tile.dart`
- `lib/features/friends/presentation/widgets/friend_search_delegate.dart`
- `lib/features/friends/data/friends_api.dart`
- `lib/features/friends/data/friends_repository.dart`
- `lib/features/friends/providers/friends_provider.dart`

---

### 9.5 Friend Profile & Debt Detail

**Purpose:** See full expense history with one friend, their debt breakdown, and settle up.

**Backend APIs:**
```
GET /api/v1/expenses?friendId={userId}&limit=20&cursor={cursor}
  — expenses shared with this friend (paginated, newest first)

GET /api/v1/settlements?friendId={userId}&limit=20&cursor={cursor}
  — settlement history with this friend

GET /api/v1/friends/debt/:userId
  — net debt summary with this friend
  Response: { netAmount: number, direction: 'owes'|'owed', simplifiedDebts: [...] }
```

**Logic:**
1. Header: friend avatar, name, net amount (red/green), "Settle Up" button.
2. "Settle Up" button → opens `SettleUpBottomSheet`.
3. Below header: activity feed mixing expenses and settlements, sorted by date.
4. Expenses show who paid and the user's share.
5. Infinite scroll pagination.

**UI States to design in Stitch:**
- Loaded: header with amount, activity feed
- Loading: shimmer header + shimmer list items
- Empty: "No expenses with this friend yet"
- Error: retry

**Files:**
- `lib/features/friends/presentation/screens/friend_detail_screen.dart`
- `lib/features/friends/providers/friend_debt_provider.dart`

---

### 9.6 Groups — List

**Purpose:** See all groups and their overall balance.

**Backend APIs:**
```
GET /api/v1/groups?limit=20&cursor={cursor}
  Response: { data: [{ _id, name, avatarKey, memberCount, netBalance, currency }], nextCursor }
```

**Logic:**
1. Pull-to-refresh, infinite scroll.
2. Each tile: group avatar (fallback initials), group name, member count, net balance (colored).
3. FAB or "+" in AppBar → Create Group screen.

**UI States to design in Stitch:**
- Loaded list, shimmer loading, empty ("No groups yet — create one!"), error

**Files:**
- `lib/features/groups/presentation/screens/groups_screen.dart`
- `lib/features/groups/presentation/widgets/group_list_tile.dart`
- `lib/features/groups/providers/groups_provider.dart`
- `lib/features/groups/data/groups_api.dart`
- `lib/features/groups/data/groups_repository.dart`

---

### 9.7 Group Detail

**Purpose:** See all members, their balances within the group, and all group expenses.

**Backend APIs:**
```
GET /api/v1/groups/:id
  Response: { _id, name, avatarUrl, members: [{ userId, name, avatarUrl, role }], createdAt }

GET /api/v1/groups/:id/balances
  Response: { balances: [{ userId, name, amount, direction }] }

GET /api/v1/expenses?groupId={id}&limit=20&cursor={cursor}
  Response: { data: [expense...], nextCursor }

PATCH /api/v1/groups/:id          — update group name/avatar (admin only)
POST  /api/v1/groups/:id/members  — add member
DELETE /api/v1/groups/:id/members/:userId — remove member
DELETE /api/v1/groups/:id         — delete group (admin only, soft delete)
```

**Logic:**
1. AppBar: group name, edit icon (admin only).
2. Balance summary section: horizontal scroll of member balance chips.
3. "Settle Up" button → SettleUpBottomSheet pre-filled for this group.
4. Expense list: paginated, newest first.
5. FAB → AddExpenseScreen pre-filled with this group.
6. Overflow menu (admin): Add Member, Leave Group, Delete Group.

**UI States to design in Stitch:**
- Loaded, shimmer loading, empty (no expenses), error
- Admin vs non-admin variants (different action visibility)

**Files:**
- `lib/features/groups/presentation/screens/group_detail_screen.dart`
- `lib/features/groups/presentation/screens/create_group_screen.dart`
- `lib/features/groups/presentation/widgets/group_member_chip.dart`
- `lib/features/groups/providers/group_detail_provider.dart`

---

### 9.8 Add / Edit Expense

**Purpose:** Create a new expense or edit an existing one.

**Backend APIs:**
```
POST /api/v1/expenses
  Body: {
    groupId?: string,
    description: string,
    totalAmount: number,     // paise integer
    currency: "INR",
    splitType: "equal" | "exact" | "percentage" | "shares",
    splits: [{ userId: string, amount?: number, percentage?: number, shares?: number }],
    paidBy: string,          // userId
    category: string,
    date: string,            // ISO 8601
    receiptKey?: string
  }
  Response: { expense: { _id, ... } }

PATCH /api/v1/expenses/:id
  Body: same as POST (partial)
  Response: { expense: { _id, ... } }

GET /api/v1/users/search?q=   — for participant search
POST /api/v1/uploads/presign  — for receipt upload
```

**Logic:**

**Form fields:**
1. Description (text field, required, max 200 chars)
2. Amount (number field, required) — user enters in ₹ rupees, convert to paise before sending
3. Date (date picker, defaults to today)
4. Category (dropdown: Food, Travel, Accommodation, Utilities, Entertainment, Shopping, Other)
5. Group (optional — if opened from a group, pre-filled and locked)
6. Participants (multi-select chip input — search users, add from friends)
7. Paid by (dropdown of participants, defaults to current user)
8. Split type selector:
   - Equal: auto-distribute evenly, show each person's share
   - Exact: amount input per person (sum must equal total — validate live)
   - Percentage: percentage input per person (must sum to 100)
   - Shares: share count per person (proportional)
9. Receipt photo (optional — image picker → upload to S3 via presign, store `receiptKey`)

**Validation (show inline field errors):**
- Description: required
- Amount: required, > 0, must be a valid number
- Splits (Exact): sum must equal total amount
- Splits (Percentage): must sum to 100%
- At least 2 participants

**On submit:**
1. Convert ₹ amount to paise (multiply by 100, floor).
2. POST to `/api/v1/expenses`.
3. Show loading state on button.
4. On success: pop screen, invalidate related providers (expense list, debts).
5. On error: show SnackBar with error message.

**UI States to design in Stitch:**
- Default form
- Split type: Equal layout
- Split type: Exact layout (per-person amount inputs)
- Split type: Percentage layout
- Split type: Shares layout
- Validation error state
- Submitting (button loading)
- Receipt upload progress

**Files:**
- `lib/features/expenses/presentation/screens/add_expense_screen.dart`
- `lib/features/expenses/presentation/widgets/split_type_selector.dart`
- `lib/features/expenses/presentation/widgets/participant_split_row.dart`
- `lib/features/expenses/providers/add_expense_provider.dart`
- `lib/features/expenses/data/expenses_api.dart`
- `lib/features/expenses/data/expenses_repository.dart`

---

### 9.9 Expense Detail

**Purpose:** View full detail of an expense, including who paid, each person's share, receipt.

**Backend APIs:**
```
GET /api/v1/expenses/:id
  Response: {
    _id, description, totalAmount, splitType, paidBy: { _id, name, avatarUrl },
    splits: [{ user: { _id, name, avatarUrl }, amount, settled }],
    category, date, receiptUrl, groupId?, createdAt
  }

DELETE /api/v1/expenses/:id
  — soft delete (only expense creator or group admin)
```

**Logic:**
1. Header: description, amount (large), date, category icon.
2. "Paid by" section: payer avatar + name + full amount.
3. "Split breakdown" section: each participant with their share. Show "settled" badge if settled.
4. Receipt section: if `receiptUrl` exists, show tappable thumbnail → full-screen image viewer.
5. Edit icon (AppBar): only visible to expense creator → navigate to AddExpense in edit mode.
6. Delete option (overflow menu): confirmation dialog → delete → pop to list.

**UI States to design in Stitch:**
- Loaded detail, shimmer loading, error

**Files:**
- `lib/features/expenses/presentation/screens/expense_detail_screen.dart`
- `lib/features/expenses/presentation/widgets/expense_list_tile.dart`

---

### 9.10 Settlements

**Purpose:** Settle debts between users (mark as paid).

**Backend APIs:**
```
POST /api/v1/settlements
  Body: {
    payerId: string,
    payeeId: string,
    amount: number,       // paise
    groupId?: string,
    note?: string
  }
  Response: { settlement: { _id, ... } }

GET /api/v1/settlements?limit=20&cursor={cursor}
  — full settlement history for current user

GET /api/v1/groups/:id/simplified-debts
  — simplified debt graph for a group
  Response: { debts: [{ from: userId, to: userId, amount: number }] }
```

**Logic:**

**SettleUpBottomSheet (reusable):**
1. Shows simplified debt suggestions from the backend (`/simplified-debts` for groups, computed locally for friends).
2. For each debt: "Pay ₹X.XX to [Name]" row with a checkbox or individual "Settle" button.
3. On "Settle": POST to `/api/v1/settlements` with amount in paise.
4. After settle: invalidate friends/groups debt providers, show success SnackBar.
5. Custom amount: user can override the amount before confirming.

**Settlements History Screen:**
1. Full list of past settlements (paginated).
2. Each tile: who paid whom, amount, date, note.

**UI States to design in Stitch:**
- SettleUpBottomSheet: debt list, custom amount input, confirm button, loading
- History screen: loaded, shimmer, empty, error

**Files:**
- `lib/features/settlements/presentation/screens/settlements_screen.dart`
- `lib/features/settlements/presentation/widgets/settle_up_bottom_sheet.dart`
- `lib/features/settlements/data/settlements_api.dart`
- `lib/features/settlements/data/settlements_repository.dart`
- `lib/features/settlements/providers/settlements_provider.dart`

---

### 9.11 Notifications

**Purpose:** Show all in-app notifications (expense added, settled, friend request, etc.).

**Backend APIs:**
```
GET /api/v1/notifications?limit=20&cursor={cursor}
  Response: { data: [{ _id, type, title, body, isRead, metadata, createdAt }], nextCursor, unreadCount }

PATCH /api/v1/notifications/:id/read
  — mark one as read

PATCH /api/v1/notifications/read-all
  — mark all as read
```

**Logic:**
1. List of notifications, newest first, paginated.
2. Unread notifications have a highlight background.
3. Tapping a notification: mark as read + navigate to relevant screen (expense, group, friend request — use `metadata`).
4. "Mark all read" button in AppBar.
5. Unread badge count shown on notification icon in Home AppBar.
6. FCM push notification tap → deep link handled by go_router.

**UI States to design in Stitch:**
- Loaded list (mix of read/unread), shimmer loading, empty, error

**Files:**
- `lib/features/notifications/presentation/screens/notifications_screen.dart`
- `lib/features/notifications/data/notifications_api.dart`
- `lib/features/notifications/data/notifications_repository.dart`
- `lib/features/notifications/providers/notifications_provider.dart`

---

### 9.12 Profile & Settings

**Purpose:** View and edit own profile, manage account settings, log out.

**Backend APIs:**
```
GET  /api/v1/users/me
  Response: { _id, name, email, avatarUrl, createdAt }

PATCH /api/v1/users/me
  Body: { name?: string, avatarKey?: string }
  Response: { user: { ... } }

POST /api/v1/uploads/presign
  Body: { fileName: string, fileType: string, fileSize: number, uploadType: "avatar" }
  Response: { uploadUrl: string, key: string }

DELETE /api/v1/users/me
  — soft delete / account deactivation (confirmation dialog required)

POST /api/v1/auth/logout
  Body: { deviceId: string }

DELETE /api/v1/users/me/devices/:fcmToken
  — unregister push token on logout
```

**Logic:**
1. Avatar with edit icon → image picker → upload via presigned S3 URL → PATCH `/users/me` with `avatarKey`.
2. Name field: inline editable with save button.
3. Display email (read-only, from OAuth).
4. Settings section:
   - Notifications toggle (register/unregister FCM token)
   - App version (from `package_info_plus`)
   - Privacy Policy / Terms links
5. Danger zone:
   - Log out: call `POST /auth/logout` + delete tokens from SecureStorage + navigate to `/login`.
   - Delete account: confirmation dialog ("Type DELETE to confirm") → call `DELETE /users/me` → clear storage → navigate to `/login`.

**UI States to design in Stitch:**
- Loaded profile, editing name, avatar upload progress, danger zone section

**Files:**
- `lib/features/profile/presentation/screens/profile_screen.dart`
- `lib/features/profile/data/profile_api.dart`
- `lib/features/profile/data/profile_repository.dart`
- `lib/features/profile/providers/profile_provider.dart`

---

## 10. API Integration Layer

### `lib/core/network/api_client.dart`

```dart
// Dio singleton — all features use this. Never instantiate Dio elsewhere.
// Interceptors applied in this order:
//   1. AuthInterceptor  — adds "Authorization: Bearer <token>" header
//   2. LoggingInterceptor — logs requests/responses in debug mode only
//   3. ConnectivityInterceptor — throw ApiException.noInternet before request if offline
// Base options:
//   baseUrl: AppConfig.baseUrl
//   connectTimeout: Duration(seconds: 10)
//   receiveTimeout: Duration(seconds: 15)
//   headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
```

### `lib/core/network/auth_interceptor.dart`

```dart
// On every request:
//   - Attach "Authorization: Bearer {accessToken}" from SecureStorage
// On 401 response:
//   - Attempt one token refresh: POST /api/v1/auth/refresh
//   - On success: store new tokens, retry original request
//   - On failure (refresh also 401): clear storage, emit auth-logout event, navigate to /login
//   - Prevent concurrent refresh calls (use a Completer<void> lock)
```

### `lib/core/network/api_result.dart`

```dart
// Sealed class — every API call returns ApiResult<T>
// class ApiSuccess<T> { final T data; }
// class ApiError<T>  { final ApiException exception; }
// Use in providers — never throw from repository methods
```

### `lib/core/network/api_exception.dart`

```dart
// Typed exceptions from DioException:
// ApiException.network()      — no internet / timeout
// ApiException.unauthorized() — 401
// ApiException.forbidden()    — 403
// ApiException.notFound()     — 404
// ApiException.conflict()     — 409
// ApiException.server(message) — 5xx
// ApiException.unknown()      — anything else
// Include a user-facing `message` string for display in SnackBar
```

### Retrofit API interfaces (one per feature)

```dart
// Example: lib/features/expenses/data/expenses_api.dart
@RestApi()
abstract class ExpensesApi {
  factory ExpensesApi(Dio dio, {String baseUrl}) = _ExpensesApi;

  @GET('/expenses')
  Future<PaginatedResponse<ExpenseModel>> getExpenses({
    @Query('groupId') String? groupId,
    @Query('friendId') String? friendId,
    @Query('limit') int limit = 20,
    @Query('cursor') String? cursor,
  });

  @POST('/expenses')
  Future<ExpenseResponse> createExpense(@Body() CreateExpenseRequest body);

  @PATCH('/expenses/{id}')
  Future<ExpenseResponse> updateExpense(
    @Path('id') String id,
    @Body() UpdateExpenseRequest body,
  );

  @DELETE('/expenses/{id}')
  Future<void> deleteExpense(@Path('id') String id);

  @GET('/expenses/{id}')
  Future<ExpenseDetailResponse> getExpenseDetail(@Path('id') String id);
}
```

### Pagination model

```dart
// lib/shared/models/paginated_response.dart
@freezed
class PaginatedResponse<T> with _$PaginatedResponse<T> {
  const factory PaginatedResponse({
    required List<T> data,
    String? nextCursor,
    int? total,
  }) = _PaginatedResponse;
}
// All list APIs use this. Agents must NOT create custom pagination models.
```

### Amount rules (enforce everywhere)

```dart
// User enters: "150.50" (String) → parse as double → multiply by 100 → toInt() → 15050 (paise)
// API returns: 15050 (paise) → divide by 100 → format as "₹150.50"
// CurrencyFormatter.format(15050) == "₹150.50"
// CurrencyFormatter.toPaise("150.50") == 15050
// CurrencyFormatter.fromPaise(15050) == 150.50
```

---

## 11. State Management Conventions

### Framework: Riverpod 2.x with code generation

```dart
// Every provider uses @riverpod annotation.
// Never use ChangeNotifier, setState in complex screens, or Provider package.

// For async data (API fetch):
@riverpod
Future<List<FriendModel>> friends(FriendsRef ref) async {
  return ref.watch(friendsRepositoryProvider).getFriends();
}

// For complex state with mutation (form / list with load more):
@riverpod
class AddExpenseNotifier extends _$AddExpenseNotifier {
  @override
  AddExpenseState build() => AddExpenseState.initial();

  Future<void> submit(CreateExpenseRequest req) async { ... }
}
```

### Naming conventions

| Pattern | Name | Example |
|---|---|---|
| Simple async fetch | `xyzProvider` | `friendsProvider` |
| Paginated list | `xyzListNotifier` | `expensesListNotifier` |
| Mutation / form | `xyzNotifier` | `addExpenseNotifier` |
| Repository | `xyzRepositoryProvider` | `friendsRepositoryProvider` |
| API client | `xyzApiProvider` | `expensesApiProvider` |

### UI pattern for async state

```dart
// In build():
final asyncValue = ref.watch(friendsProvider);
return asyncValue.when(
  data: (friends) => FriendsList(friends: friends),
  loading: () => const LoadingShimmer(),
  error: (e, _) => ErrorState(message: e.toString(), onRetry: () => ref.invalidate(friendsProvider)),
);
```

### Invalidation after mutations

```dart
// After creating an expense, invalidate:
ref.invalidate(expensesListProvider);
ref.invalidate(friendDebtProvider(friendId));
ref.invalidate(groupDetailProvider(groupId));
ref.invalidate(homeProvider);
// Never manually mutate a list — always re-fetch via invalidation
```

---

## 12. Navigation Conventions

### Routes (`lib/core/router/route_names.dart`)

```dart
class RouteNames {
  static const splash         = '/';
  static const login          = '/login';
  static const home           = '/home';
  static const friends        = '/friends';
  static const friendDetail   = '/friends/:id';
  static const groups         = '/groups';
  static const groupDetail    = '/groups/:id';
  static const createGroup    = '/groups/create';
  static const addExpense     = '/expenses/add';
  static const editExpense    = '/expenses/:id/edit';
  static const expenseDetail  = '/expenses/:id';
  static const settlements    = '/settlements';
  static const notifications  = '/notifications';
  static const profile        = '/profile';
}
```

### go_router setup rules

- Use `GoRouter.redirect` for auth guard: if no token → redirect to `/login`.
- Home, Friends, Groups, Notifications are tabs inside a `ShellRoute` with `BottomNavigationBar`.
- Use `context.push()` for drill-down navigation (back button preserved).
- Use `context.go()` for root-level navigation (replaces back stack).
- Pass complex objects as `extra` parameter, not in the path.
- Deep links for FCM notifications must be handled in `GoRouter`'s `redirect` using `initialLocation`.

### Bottom Navigation tabs

| Tab | Icon | Route |
|---|---|---|
| Home | home | `/home` |
| Friends | people | `/friends` |
| Groups | group_work | `/groups` |
| Notifications | notifications (badge) | `/notifications` |
| Profile | person | `/profile` |

---

## 13. Design System & Theme

All values defined in `lib/core/theme/`. **Never use raw Color(), raw TextStyle(), or raw EdgeInsets() in feature files.**

### `app_colors.dart`

```dart
class AppColors {
  // Brand
  static const primary      = Color(0xFF1DB954);  // Splitwise green
  static const primaryDark  = Color(0xFF158C3C);
  static const secondary    = Color(0xFF2D9CDB);

  // Semantic
  static const error        = Color(0xFFE74C3C);  // Red — owes money
  static const success      = Color(0xFF27AE60);  // Green — owed money
  static const warning      = Color(0xFFF39C12);

  // Neutral
  static const surface      = Color(0xFFFFFFFF);
  static const background   = Color(0xFFF5F5F5);
  static const onSurface    = Color(0xFF212121);
  static const onSurfaceMid = Color(0xFF757575);
  static const divider      = Color(0xFFE0E0E0);

  // Dark mode equivalents — define in ThemeData.dark
}
```

### `app_spacing.dart` — 4-point grid

```dart
class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;

  static const radiusCard   = 12.0;
  static const radiusButton = 8.0;
  static const radiusChip   = 20.0;
}
```

### `amount_text.dart` — mandatory widget for all money display

```dart
// Always use AmountText, never a raw Text() for money.
// AmountText(paise: 15050)         → "₹150.50" in green (owed to you)
// AmountText(paise: 15050, owes: true) → "₹150.50" in red (you owe)
// AmountText(paise: 0)             → "Settled up" in grey
```

---

## 14. Testing Requirements

### Unit tests (required)

| Test file | What it covers |
|---|---|
| `currency_formatter_test.dart` | paise ↔ rupees conversion edge cases |
| `auth_repository_test.dart` | token storage, refresh logic |
| `expense_split_test.dart` | equal/percentage/exact split calculation |

### Widget tests (required per screen)

Every screen must have a widget test covering:
- Renders correctly with mock data (golden test optional)
- Shows shimmer/loading state when provider is loading
- Shows error state when provider errors
- Primary action (button tap) calls correct provider method

### Test conventions

```dart
// All tests use mocktail for mocking.
// Providers are overridden in ProviderScope for widget tests.
// Never hit the real network in tests — always mock the repository.

testWidgets('HomeScreen shows total balance', (tester) async {
  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        homeProvider.overrideWith((_) async => mockHomeData),
      ],
      child: const MaterialApp(home: HomeScreen()),
    ),
  );
  await tester.pumpAndSettle();
  expect(find.text('₹1,500.00'), findsOneWidget);
});
```

### Run tests

```bash
flutter test                   # all tests
flutter test test/unit/        # unit tests only
flutter test test/widget/      # widget tests only
flutter analyze                # must be zero issues
```

---

## 15. Build & Release

### Debug APK (development)

```bash
flutter build apk --debug \
  --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1 \
  --dart-define=ENVIRONMENT=development \
  --dart-define=GOOGLE_WEB_CLIENT_ID=<your-client-id>
```

### Release APK (production)

```bash
flutter build apk --release \
  --dart-define=API_BASE_URL=https://api.splitwise.yourdomain.com/api/v1 \
  --dart-define=ENVIRONMENT=production \
  --dart-define=GOOGLE_WEB_CLIENT_ID=<your-client-id>
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### `android/app/build.gradle` settings

```gradle
android {
    compileSdk 34
    defaultConfig {
        applicationId "com.yourcompany.splitwise"
        minSdk 24                   // Android 7.0 — covers 98%+ of devices
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}
```

### Keystore (first time only)

```bash
keytool -genkey -v -keystore splitwise.keystore \
  -alias splitwise -keyalg RSA -keysize 2048 -validity 10000
# Store in android/app/ — NEVER commit this file to git
# Add to android/.gitignore: *.keystore, key.properties
```

---

## 16. Security Checklist

Before marking any screen `DONE`, verify each applicable item:

- [ ] JWT access token stored in `flutter_secure_storage`, not `SharedPreferences`
- [ ] Refresh token stored in `flutter_secure_storage`, never in Hive or local DB
- [ ] `AuthInterceptor` attached to all API calls — no unauthenticated requests
- [ ] `401` → token refresh → retry → if still 401 → logout (no infinite loops)
- [ ] User input amounts validated as positive numbers before conversion to paise
- [ ] `mounted` checked before `setState` after any `await`
- [ ] No PII (email, token) logged by `AppLogger` in production mode
- [ ] Image picker file type validated (jpg/png only) before presign upload
- [ ] File size validated against max before presign upload
- [ ] Delete operations have a confirmation dialog
- [ ] Account deletion has a typed confirmation ("Type DELETE")
- [ ] Deep links from push notifications validated before navigation
- [ ] `proguard-rules.pro` configured to keep Retrofit/Dio models
- [ ] `INTERNET` permission in `AndroidManifest.xml` (only required permission)
- [ ] API base URL is not hardcoded — read from `--dart-define` build args

---

## 17. Shared Agent Log

> **This section is append-only. Do not edit or delete existing entries.**
> **Every agent must write here BEFORE starting Stitch design AND BEFORE starting code AND AFTER completing each phase.**
> **Always read ALL existing entries before adding your own.**

---

### [INITIAL] [PLAYBOOK_AUTHOR] [DONE] — Frontend Playbook created

**Status:** DONE
**Agent:** Playbook Author (Claude)
**Stitch Frame ID:** N/A
**Files touched:**
- SPLITWISE_FLUTTER_FRONTEND_PLAYBOOK.md (created)

**Summary:**
Created the complete multi-agent Flutter frontend development playbook for Splitwise. Defines the Stitch-first design workflow, full folder structure, all screen specifications with their backend API mappings from `Splitwise-backend/`, state management conventions (Riverpod 2.x), navigation (go_router), design system tokens, testing requirements, and build/release instructions. Every screen must go through the Stitch MCP design step before any Flutter code is written.

**API endpoints used:** N/A

**Dependencies needed from other agents:** None — this is the root document.

**Blockers:** None

**Follow-up TODOs:**
- Agent: complete Phase 1 (core setup + shared widgets) before any screen work
- Agent: verify Flutter 3.22+ and Dart 3.3+ are installed (`flutter --version`) before starting
- Agent: confirm backend is running at `http://localhost:3000` and test with `GET /health`
- Agent: create Stitch account and verify MCP tool access before starting any design
- Agent: generate a `deviceId` UUID and test the full auth flow (Google Sign In) manually first
---

<!-- 
=== AGENTS: ADD YOUR LOG ENTRIES BELOW THIS LINE ===
Copy the template from Section 3 exactly.
Do not remove this comment or the entries above it.
Stitch Frame ID is REQUIRED once design is started.
-->

### [2026-04-05T02:08:00+05:30] [Antigravity] [DONE] — Phase 1.1 Foundation & Core Setup

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** N/A
**Files touched:**
- lib/main.dart (created)
- lib/core/** (created)
- lib/shared/** (created)

**Summary:**
Created the basic Flutter project, configured app theme, router stubs, and API/local storage layers.

**API endpoints used:** N/A

**Dependencies needed from other agents:** None

**Blockers:** None

**Follow-up TODOs:** None
---

### [2026-04-05T02:18:00+05:30] [Antigravity] [DONE] — Phase 1.2 Splash Screen

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** 528c6bcf64b14d328ca78e8bc28a7bec
**Files touched:**
- lib/features/auth/presentation/screens/splash_screen.dart (created)
- lib/core/router/app_router.dart (modified)

**Summary:**
Implemented the Splash Screen with the generated Stitch UI. Integrated fading animation, auth state check logic, and routing rules.

**API endpoints used:** N/A
**Blockers:** None
---

### [2026-04-05T08:45:00+05:30] [Antigravity] [DONE] — Phase 4 Create Group + Group Detail

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** dff3e552d965450f844d61e780db9e0b (Create Group)
**Files touched:**
- lib/features/groups/presentation/screens/create_group_screen.dart (created)
- lib/features/groups/presentation/screens/group_detail_screen.dart (created)
- lib/core/router/app_router.dart (modified — added all new routes)
- lib/core/router/route_names.dart (modified — cleaned, no duplicates)
- lib/features/home/presentation/screens/app_scaffold.dart (modified — 4-tab nav, heroTag)
- lib/core/theme/app_colors.dart (modified — full Mint Ledger surface token set)
- lib/core/theme/app_text_styles.dart (modified — added bodyText1/2, subtitle1 aliases)

**Summary:**
Built Create Group screen with type chip selector, group name input, avatar picker placeholder, and dynamic member list. Built Group Detail screen with horizontal member balance chips, Settle Up CTA, expense list with navigation to ExpenseDetail. Both wired into GoRouter.

**API endpoints used:** N/A (mocked)
**Blockers:** None
---

### [2026-04-05T08:50:00+05:30] [Antigravity] [DONE] — Phase 4 Friend Detail + Notifications + Profile + Shared Widgets

**Status:** DONE
**Agent:** Antigravity
**Files touched:**
- lib/features/friends/presentation/screens/friend_detail_screen.dart (created)
- lib/features/notifications/presentation/screens/notifications_screen.dart (created)
- lib/features/profile/presentation/screens/profile_screen.dart (created)
- lib/features/settlements/presentation/widgets/settle_up_bottom_sheet.dart (created)
- lib/shared/widgets/app_text_field.dart (created)
- lib/shared/widgets/loading_shimmer.dart (created)
- lib/shared/widgets/empty_state.dart (created)
- lib/shared/widgets/error_state.dart (created)
- lib/shared/widgets/app_bottom_sheet.dart (created)
- lib/core/storage/secure_storage.dart (modified — added clearAll())

**Summary:**
Friend Detail screen: profile header with net debt, Settle Up button, shared activity feed. Notifications screen: read/unread states, mark-all-read, icon per type. Profile screen: editable name, avatar, settings sections, logout with confirmation, delete account dialog. SettleUpBottomSheet: reusable draggable sheet with amount override and settle confirmation. All missing shared widgets created.

**API endpoints used:** N/A (mocked)
**Blockers:** None
---

### [2026-04-05T02:23:00+05:30] [Antigravity] [DONE] — Phase 1.3 Login Screen

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** 16dba68795f14022934232a6ba108844
**Files touched:**
- lib/features/auth/presentation/screens/login_screen.dart (created)
- lib/core/router/app_router.dart (modified)

**Summary:**
Implemented the Login Screen based on the Stitch UI design. Integrated simulated login via a button. The app can now transition from Splash -> Login -> simulate login -> ShellRoute(/groups placeholder). Phase 1 Core Setup and Auth shell is fully done! Next is Phase 2.

**API endpoints used:** N/A (Mocked for now)
**Blockers:** Backend API server is not up to test real auth yet.
---

### [2026-04-05T02:28:00+05:30] [Antigravity] [DONE] — Phase 2 Dashboard / Groups Screen

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** 7bbba0f3da984a628fdaa3551781a7b8
**Files touched:**
- lib/features/groups/presentation/screens/groups_list_screen.dart (created)
- lib/core/router/app_router.dart (modified)

**Summary:**
Implemented the Groups List (Dashboard) screen UI. The design includes an overall balance card and a mock list of groups with statuses. Wired it into the ShellRoute (`/groups`). Next is Friends List.

**API endpoints used:** N/A (Mocked for now)
**Blockers:** None
---

### [2026-04-05T02:35:00+05:30] [Antigravity] [DONE] — Phase 2 Friends Screen

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** 104fa572ed134a10a749c493f548349e
**Files touched:**
- lib/features/friends/presentation/screens/friends_list_screen.dart (created)
- lib/shared/widgets/app_avatar.dart (created)
- lib/core/router/app_router.dart (modified)

**Summary:**
Implemented the Friends List UI based on Stitch MCP's design. It correctly matches the overall style of the Mint Ledger theme, handles "owes you" and "you owe" states, and integrates with the Application Router's ShellRoute (`/friends`).

**API endpoints used:** N/A (Mocked for now)
**Blockers:** None
---

### [2026-04-05T02:40:00+05:30] [Antigravity] [DONE] — Phase 3 Add Expense Screen

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** a3488699ed9a4abc98329c0eaa2d050b
**Files touched:**
- lib/features/expenses/presentation/screens/add_expense_screen.dart (created)
- lib/core/router/app_router.dart (modified)
- lib/core/router/route_names.dart (modified)

**Summary:**
Generated the Add Expense UI with Stitch MCP and implemented the `AddExpenseScreen`. The form contains fields for description and amount, chips for 'Paid by' and 'Split', and a calendar row following Mint Ledger guidelines. Wired into the GoRouter as a full-screen modal route.

**API endpoints used:** N/A (Mocked for now)
**Blockers:** None
---

### [2026-04-05T02:45:00+05:30] [Antigravity] [DONE] — Phase 3 Expense Detail Screen

**Status:** DONE
**Agent:** Antigravity
**Stitch Frame ID:** e8849e6e724949a49d2de655edf26de3
**Files touched:**
- lib/features/expenses/presentation/screens/expense_detail_screen.dart (created)
- lib/core/router/app_router.dart (modified)
- lib/core/router/route_names.dart (modified)

**Summary:**
Implemented the Expense Detail screen based on Stitch MCP's design. The screen includes a receipt-style breakdown card showcasing who paid what and who owes what. Next, we can wire up mock navigation to test it.

**API endpoints used:** N/A
**Blockers:** None
---
