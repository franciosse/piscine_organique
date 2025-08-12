(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/app/[locale]/components/admin/admin.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "AdminChapters": (()=>AdminChapters),
    "AdminCourses": (()=>AdminCourses),
    "AdminLessons": (()=>AdminLessons)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature();
;
const api = {
    getCourses: async ()=>await fetch('/api/admin/courses').then((res)=>res.json()),
    getChapters: async (courseId)=>await fetch(`/api/admin/courses/${courseId}/chapters`).then((res)=>res.json()),
    getLessons: async (chapterId)=>await fetch(`/api/admin/chapters/${chapterId}/lessons`).then((res)=>res.json()),
    createCourse: async (title)=>({
            id: Date.now(),
            title
        }),
    createChapter: async (courseId, title)=>({
            id: Date.now(),
            title,
            courseId
        }),
    createLesson: async (chapterId, title)=>({
            id: Date.now(),
            title,
            chapterId
        })
};
function AdminCourses({ onSelectCourse }) {
    _s();
    const [courses, setCourses] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newCourseTitle, setNewCourseTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminCourses.useEffect": ()=>{
            api.getCourses().then({
                "AdminCourses.useEffect": (data)=>setCourses(data.courses || data)
            }["AdminCourses.useEffect"]); // selon ton API
        }
    }["AdminCourses.useEffect"], []);
    const addCourse = async ()=>{
        if (!newCourseTitle.trim()) return;
        const newCourse = await api.createCourse(newCourseTitle);
        setCourses((prev)=>[
                ...prev,
                newCourse
            ]);
        setNewCourseTitle('');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "Administration des Cours"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                children: courses.map((course)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onSelectCourse(course.id),
                            children: course.title
                        }, void 0, false, {
                            fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                            lineNumber: 53,
                            columnNumber: 13
                        }, this)
                    }, course.id, false, {
                        fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                        lineNumber: 52,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 50,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Nouveau cours",
                value: newCourseTitle,
                onChange: (e)=>setNewCourseTitle(e.target.value)
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: addCourse,
                children: "Ajouter un cours"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/[locale]/components/admin/admin.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_s(AdminCourses, "GGdAHnO07jS2udG9IDA7f64Brow=");
_c = AdminCourses;
function AdminChapters({ courseId, onBack, onSelectChapter }) {
    _s1();
    const [chapters, setChapters] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newChapterTitle, setNewChapterTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminChapters.useEffect": ()=>{
            api.getChapters(courseId).then({
                "AdminChapters.useEffect": (data)=>setChapters(data.chapters || data)
            }["AdminChapters.useEffect"]);
        }
    }["AdminChapters.useEffect"], [
        courseId
    ]);
    const addChapter = async ()=>{
        if (!newChapterTitle.trim()) return;
        const newChapter = await api.createChapter(courseId, newChapterTitle);
        setChapters((prev)=>[
                ...prev,
                newChapter
            ]);
        setNewChapterTitle('');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onBack,
                children: "← Retour aux cours"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 91,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: [
                    "Chapitres du cours #",
                    courseId
                ]
            }, void 0, true, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 92,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                children: chapters.map((ch)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>onSelectChapter(ch.id),
                            children: ch.title
                        }, void 0, false, {
                            fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                            lineNumber: 96,
                            columnNumber: 13
                        }, this)
                    }, ch.id, false, {
                        fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                        lineNumber: 95,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Nouveau chapitre",
                value: newChapterTitle,
                onChange: (e)=>setNewChapterTitle(e.target.value)
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: addChapter,
                children: "Ajouter un chapitre"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 106,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/[locale]/components/admin/admin.tsx",
        lineNumber: 90,
        columnNumber: 5
    }, this);
}
_s1(AdminChapters, "UXL4zvfJuEm6/Mw+rIxpphcLa2g=");
_c1 = AdminChapters;
function AdminLessons({ chapterId, onBack }) {
    _s2();
    const [lessons, setLessons] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [newLessonTitle, setNewLessonTitle] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AdminLessons.useEffect": ()=>{
            api.getLessons(chapterId).then({
                "AdminLessons.useEffect": (data)=>setLessons(data.lessons || data)
            }["AdminLessons.useEffect"]);
        }
    }["AdminLessons.useEffect"], [
        chapterId
    ]);
    const addLesson = async ()=>{
        if (!newLessonTitle.trim()) return;
        const newLesson = await api.createLesson(chapterId, newLessonTitle);
        setLessons((prev)=>[
                ...prev,
                newLesson
            ]);
        setNewLessonTitle('');
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: onBack,
                children: "← Retour aux chapitres"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 133,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: [
                    "Leçons du chapitre #",
                    chapterId
                ]
            }, void 0, true, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                children: lessons.map((l)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                        children: l.title
                    }, l.id, false, {
                        fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 135,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                type: "text",
                placeholder: "Nouvelle leçon",
                value: newLessonTitle,
                onChange: (e)=>setNewLessonTitle(e.target.value)
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 140,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                onClick: addLesson,
                children: "Ajouter une leçon"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/components/admin/admin.tsx",
                lineNumber: 146,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/[locale]/components/admin/admin.tsx",
        lineNumber: 132,
        columnNumber: 5
    }, this);
}
_s2(AdminLessons, "g9gy9SeGuoszj3dDWUBaBCrG+tE=");
_c2 = AdminLessons;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "AdminCourses");
__turbopack_context__.k.register(_c1, "AdminChapters");
__turbopack_context__.k.register(_c2, "AdminLessons");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>AdminPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f5b$locale$5d2f$components$2f$admin$2f$admin$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/[locale]/components/admin/admin.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function AdminPage() {
    _s();
    const [selectedCourseId, setSelectedCourseId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedChapterId, setSelectedChapterId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "flex-1 p-4 lg:p-8",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-lg lg:text-2xl font-medium text-gray-900 mb-6",
                children: "Course Administration"
            }, void 0, false, {
                fileName: "[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    !selectedCourseId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f5b$locale$5d2f$components$2f$admin$2f$admin$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminCourses"], {
                        onSelectCourse: (id)=>{
                            setSelectedCourseId(id);
                            setSelectedChapterId(null);
                        }
                    }, void 0, false, {
                        fileName: "[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx",
                        lineNumber: 16,
                        columnNumber: 13
                    }, this),
                    selectedCourseId && !selectedChapterId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f5b$locale$5d2f$components$2f$admin$2f$admin$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminChapters"], {
                        courseId: selectedCourseId,
                        onBack: ()=>setSelectedCourseId(null),
                        onSelectChapter: (id)=>setSelectedChapterId(id)
                    }, void 0, false, {
                        fileName: "[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx",
                        lineNumber: 25,
                        columnNumber: 13
                    }, this),
                    selectedCourseId && selectedChapterId && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$app$2f5b$locale$5d2f$components$2f$admin$2f$admin$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdminLessons"], {
                        chapterId: selectedChapterId,
                        onBack: ()=>setSelectedChapterId(null)
                    }, void 0, false, {
                        fileName: "[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx",
                        lineNumber: 33,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx",
                lineNumber: 14,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/[locale]/(dashboard)/dashboard/admin/page.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_s(AdminPage, "tWScG6bOpvfFfEo8vSd5IFk+gRE=");
_c = AdminPage;
var _c;
__turbopack_context__.k.register(_c, "AdminPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=app_%5Blocale%5D_736a83b0._.js.map