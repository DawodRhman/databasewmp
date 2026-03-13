// ─── Route Migration Helper ────────────────────────────────────────────────
// Utility to help convert Next.js App Router API routes to Express routes.
//
// USAGE:
//   1. Copy your Next.js route handler function body
//   2. Replace `new URL(request.url)` → `req.query` (Express parses query params)
//   3. Replace `request.json()` → `req.body` (Express parses JSON body)
//   4. Replace `request.formData()` → Use multer middleware
//   5. Replace `apiResponse(data, meta)` → `apiResponse(res, data, meta)`
//   6. Replace `apiError(error)` → `apiError(res, error)`
//   7. Replace `NextResponse.json(...)` → `res.json(...)`
//   8. Remove `export const dynamic = 'force-dynamic'`
//   9. Replace `import { auth } from '@/auth'` → use `requireAuth` middleware
//  10. Replace `const session = await auth()` → use `req.user` from middleware
//
// PATTERN CONVERSION EXAMPLES:
//
// ── Next.js (before) ──────────────────────────────────────────
//   export async function GET(request) {
//     const session = await auth();
//     if (!session?.user) return apiError(new UnauthorizedError());
//     const { searchParams } = new URL(request.url);
//     const id = searchParams.get('id');
//     ...
//     return apiResponse(data, meta);
//   }
//
// ── Express (after) ───────────────────────────────────────────
//   router.get('/', requireAuth, async (req, res) => {
//     const { id } = req.query;
//     ...
//     return apiResponse(res, data, meta);
//   });
//
// ── File Upload (Next.js → Express) ──────────────────────────
//   // Before: const formData = await request.formData();
//   //         const file = formData.get('image');
//   // After:  Use multer middleware, file is at req.file
//   router.post('/', requireAuth, upload.single('image'), async (req, res) => {
//     const file = req.file;
//     const { name, email } = req.body; // form fields
//   });
//
// ────────────────────────────────────────────────────────────────────────────

console.log('This is a documentation file. See comments above for migration patterns.');
