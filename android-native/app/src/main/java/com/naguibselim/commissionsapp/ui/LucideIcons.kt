package com.naguibselim.commissionsapp.ui

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Fingerprint
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.PathBuilder
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

object LucideIcons {
    private fun strokeVector(
        name: String,
        block: ImageVector.Builder.() -> Unit
    ): ImageVector {
        return ImageVector.Builder(
            name = name,
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f
        ).apply(block).build()
    }

    private fun ImageVector.Builder.strokePath(
        strokeWidth: Float = 2f,
        pathBuilder: PathBuilder.() -> Unit
    ) {
        path(
            fill = null,
            stroke = SolidColor(Color.Black),
            strokeLineWidth = strokeWidth,
            strokeLineCap = StrokeCap.Round,
            strokeLineJoin = StrokeJoin.Round,
            pathFillType = PathFillType.NonZero,
            pathBuilder = pathBuilder
        )
    }

    private fun PathBuilder.circlePath(cx: Float, cy: Float, r: Float) {
        moveTo(cx + r, cy)
        arcTo(r, r, 0f, isMoreThanHalf = false, isPositiveArc = true, cx - r, cy)
        arcTo(r, r, 0f, isMoreThanHalf = false, isPositiveArc = true, cx + r, cy)
        close()
    }

    /**
     * Customer Balances & Debtors Icon (`CustomerBalances`)
     * Specifically represents customers who have outstanding balances ("العملاء الذين عليهم مديونيات / مستحقات")
     * Matches the customer accounts section and receivables card.
     */
    val CustomerBalances: ImageVector by lazy { Users }

    /**
     * Scale / Balance Icon (`Scale`)
     */
    val Scale: ImageVector by lazy {
        strokeVector("LucideScale") {
            // Center mast
            strokePath(2f) {
                moveTo(12f, 3f)
                lineTo(12f, 21f)
            }
            // Base stand
            strokePath(2f) {
                moveTo(7f, 21f)
                lineTo(17f, 21f)
            }
            // Top beam
            strokePath(2f) {
                moveTo(4f, 7f)
                lineTo(20f, 7f)
            }
            // Left pan lines & bowl
            strokePath(1.8f) {
                moveTo(4f, 7f)
                lineTo(1.5f, 13f)
                moveTo(4f, 7f)
                lineTo(6.5f, 13f)
                // Left pan bowl
                moveTo(1.5f, 13f)
                curveTo(1.5f, 16f, 6.5f, 16f, 6.5f, 13f)
            }
            // Right pan lines & bowl
            strokePath(1.8f) {
                moveTo(20f, 7f)
                lineTo(17.5f, 13f)
                moveTo(20f, 7f)
                lineTo(22.5f, 13f)
                // Right pan bowl
                moveTo(17.5f, 13f)
                curveTo(17.5f, 16f, 22.5f, 16f, 22.5f, 13f)
            }
        }
    }

    /**
     * WhatsApp Brand Vector Icon — Authentic solid white speech bubble and handset silhouette
     */
    val WhatsApp: ImageVector by lazy {
        ImageVector.Builder(
            name = "WhatsApp",
            defaultWidth = 24.dp,
            defaultHeight = 24.dp,
            viewportWidth = 24f,
            viewportHeight = 24f
        ).apply {
            path(
                fill = SolidColor(Color.White),
                stroke = null,
                pathFillType = PathFillType.EvenOdd
            ) {
                moveTo(12.00f, 2.00f)
                curveTo(6.48f, 2.00f, 2.00f, 6.48f, 2.00f, 12.00f)
                curveTo(2.00f, 13.76f, 2.46f, 15.42f, 3.26f, 16.86f)
                lineTo(2.00f, 22.00f)
                lineTo(7.28f, 20.76f)
                curveTo(8.68f, 21.53f, 10.28f, 22.00f, 12.00f, 22.00f)
                curveTo(17.52f, 22.00f, 22.00f, 17.52f, 22.00f, 12.00f)
                curveTo(22.00f, 6.48f, 17.52f, 2.00f, 12.00f, 2.00f)
                close()
                moveTo(12.00f, 20.26f)
                curveTo(10.50f, 20.26f, 9.09f, 19.86f, 7.88f, 19.15f)
                lineTo(7.58f, 18.98f)
                lineTo(4.52f, 19.70f)
                lineTo(5.32f, 16.71f)
                lineTo(5.12f, 16.41f)
                curveTo(4.35f, 15.16f, 3.90f, 13.69f, 3.90f, 12.10f)
                curveTo(3.90f, 7.54f, 7.60f, 3.84f, 12.00f, 3.84f)
                curveTo(16.40f, 3.84f, 20.10f, 7.54f, 20.10f, 12.10f)
                curveTo(20.10f, 16.66f, 16.40f, 20.25f, 12.00f, 20.25f)
                close()
                moveTo(17.47f, 14.38f)
                curveTo(17.17f, 14.23f, 15.69f, 13.50f, 15.42f, 13.40f)
                curveTo(15.14f, 13.30f, 14.94f, 13.25f, 14.74f, 13.55f)
                curveTo(14.54f, 13.85f, 13.96f, 14.53f, 13.79f, 14.73f)
                curveTo(13.61f, 14.93f, 13.44f, 14.96f, 13.14f, 14.81f)
                curveTo(12.83f, 14.66f, 11.86f, 14.34f, 10.71f, 13.31f)
                curveTo(9.82f, 12.51f, 9.21f, 11.52f, 9.04f, 11.22f)
                curveTo(8.86f, 10.92f, 9.02f, 10.76f, 9.17f, 10.61f)
                curveTo(9.30f, 10.47f, 9.47f, 10.26f, 9.62f, 10.08f)
                curveTo(9.77f, 9.91f, 9.82f, 9.78f, 9.92f, 9.58f)
                curveTo(10.02f, 9.38f, 9.97f, 9.21f, 9.90f, 9.05f)
                curveTo(9.82f, 8.90f, 9.22f, 7.42f, 8.97f, 6.82f)
                curveTo(8.72f, 6.24f, 8.48f, 6.32f, 8.29f, 6.31f)
                curveTo(8.12f, 6.30f, 7.92f, 6.30f, 7.71f, 6.30f)
                curveTo(7.51f, 6.30f, 7.19f, 6.37f, 6.91f, 6.67f)
                curveTo(6.64f, 6.97f, 5.86f, 7.70f, 5.86f, 9.18f)
                curveTo(5.86f, 10.66f, 6.94f, 12.09f, 7.09f, 12.29f)
                curveTo(7.24f, 12.49f, 9.21f, 15.53f, 12.23f, 16.83f)
                curveTo(12.94f, 17.14f, 13.50f, 17.33f, 13.94f, 17.47f)
                curveTo(14.66f, 17.70f, 15.32f, 17.66f, 15.83f, 17.59f)
                curveTo(16.41f, 17.50f, 17.61f, 16.86f, 17.87f, 16.16f)
                curveTo(18.12f, 15.46f, 18.12f, 14.85f, 18.04f, 14.73f)
                curveTo(17.97f, 14.60f, 17.76f, 14.53f, 17.46f, 14.38f)
                close()
            }
        }.build()
    }

    /**
     * Biometric / Fingerprint Vector Icon (Google Material Official Fingerprint Icon)
     */
    val Fingerprint: ImageVector
        get() = Icons.Default.Fingerprint

    /** Lucide `user-round-cog` — used in bottom nav "حسابي" / Account with settings emblem */
    val UserCog: ImageVector by lazy {
        strokeVector("UserCog") {
            // User head
            strokePath(1.9f) {
                circlePath(10f, 7f, 3.8f)
            }
            // User body / shoulders (leaving space on right for gear)
            strokePath(1.9f) {
                moveTo(14.5f, 18.5f)
                arcTo(6.5f, 6.5f, 0f, false, false, 3.5f, 18.5f)
            }
            // Gear center circle
            strokePath(1.8f) {
                circlePath(18f, 17f, 1.8f)
            }
            // Gear teeth
            strokePath(1.8f) {
                moveTo(18f, 14f); lineTo(18f, 14.8f)
                moveTo(18f, 19.2f); lineTo(18f, 20f)
                moveTo(15f, 17f); lineTo(15.8f, 17f)
                moveTo(20.2f, 17f); lineTo(21f, 17f)
                moveTo(15.9f, 14.9f); lineTo(16.5f, 15.5f)
                moveTo(19.5f, 18.5f); lineTo(20.1f, 19.1f)
                moveTo(15.9f, 19.1f); lineTo(16.5f, 18.5f)
                moveTo(19.5f, 15.5f); lineTo(20.1f, 14.9f)
            }
        }
    }

    /**
     * Updated Modern Collections Icon (`Coins` / Stacked Financial Coins) —
     * used in bottom nav "التحصيل", Collections hero card, and Summary collections row.
     */
    val HandCoins: ImageVector by lazy {
        strokeVector("CollectionsCoins") {
            // Front coin (cx = 8.5, cy = 8.5, r = 5.5)
            strokePath {
                circlePath(8.5f, 8.5f, 5.5f)
            }
            // Inner detail on front coin (vertical bar / 1 mark)
            strokePath {
                moveTo(7.8f, 6.7f)
                horizontalLineTo(8.7f)
                verticalLineTo(10.5f)
            }
            // Back / lower stacked coin arc + rim
            strokePath {
                moveTo(13.8f, 10.2f)
                curveTo(17.4f, 10.9f, 20f, 13.8f, 20f, 16.5f)
                curveTo(20f, 19.6f, 16.9f, 21.5f, 13.5f, 21.5f)
                curveTo(10.4f, 21.5f, 7.8f, 19.8f, 7.1f, 17.2f)
            }
            // Mid coin ridge accent
            strokePath {
                moveTo(15.2f, 14.2f)
                lineTo(13.2f, 16.2f)
                lineTo(15.2f, 18.2f)
            }
        }
    }

    /**
     * Exact Lucide `coins` Icon (`CoinsIcon`) — matching the web app's Collections icon
     */
    val Coins: ImageVector by lazy {
        strokeVector("LucideCoins") {
            // Front circle
            strokePath {
                circlePath(8f, 8f, 6f)
            }
            // Back circle arc
            strokePath {
                moveTo(18.09f, 10.37f)
                arcTo(6f, 6f, 0f, isMoreThanHalf = true, isPositiveArc = true, 10.34f, 18f)
            }
            // "1" digit in front coin
            strokePath {
                moveTo(7f, 6f)
                horizontalLineTo(8f)
                verticalLineTo(10f)
            }
            // Mark in back coin
            strokePath {
                moveTo(16.71f, 13.88f)
                lineTo(17.41f, 14.59f)
                lineTo(14.59f, 17.41f)
            }
        }
    }

    /**
     * Exact Lucide `chart-no-axes-combined` Icon (`ChartNoAxesCombinedIcon`) — matching the web app's Sales icon
     */
    val ChartNoAxesCombined: ImageVector by lazy {
        strokeVector("LucideChartNoAxesCombined") {
            // Upward trend line
            strokePath {
                moveTo(22f, 3f)
                lineTo(13.354f, 11.646f)
                lineTo(9f, 8f)
                lineTo(2f, 15f)
            }
            // 5 vertical bars: x=4, 8, 12, 16, 20
            strokePath {
                moveTo(4f, 18f)
                verticalLineTo(21f)
                moveTo(8f, 14f)
                verticalLineTo(21f)
                moveTo(12f, 16f)
                verticalLineTo(21f)
                moveTo(16f, 14f)
                verticalLineTo(21f)
                moveTo(20f, 10f)
                verticalLineTo(21f)
            }
        }
    }
    val ShoppingCart: ImageVector by lazy { ChartNoAxesCombined }

    /**
     * Modern Light Bulb Icon (`Lightbulb`) —
     * used inside the circular Day/Night mode toggle button next to the Notification Bell.
     */
    val Lightbulb: ImageVector by lazy {
        strokeVector("Lightbulb") {
            // Bulb glass dome & neck
            strokePath {
                moveTo(15f, 14f)
                curveTo(15.4f, 12.8f, 16.2f, 11.9f, 17.1f, 10.9f)
                curveTo(18.3f, 9.7f, 19f, 8.1f, 19f, 6.5f)
                curveTo(19f, 3.2f, 15.9f, 1.5f, 12f, 1.5f)
                curveTo(8.1f, 1.5f, 5f, 3.2f, 5f, 6.5f)
                curveTo(5f, 8.1f, 5.7f, 9.7f, 6.9f, 10.9f)
                curveTo(7.8f, 11.9f, 8.6f, 12.8f, 9f, 14f)
            }
            // Screw base lines
            strokePath {
                moveTo(9f, 18f)
                horizontalLineTo(15f)
                moveTo(10f, 21.5f)
                horizontalLineTo(14f)
            }
            // Subtle inner filament arc
            strokePath(strokeWidth = 1.6f) {
                moveTo(10f, 8.5f)
                curveTo(10.8f, 7.2f, 13.2f, 7.2f, 14f, 8.5f)
            }
        }
    }

    /**
     * Modern Search Icon (`Search`) — used in the expandable Sales search bar.
     */
    val Search: ImageVector by lazy {
        strokeVector("Search") {
            strokePath {
                circlePath(11f, 11f, 7.5f)
            }
            strokePath {
                moveTo(20.5f, 20.5f)
                lineTo(16.4f, 16.4f)
            }
        }
    }

    /** Lucide `file-text` — used in bottom nav "الكشف" */
    val FileText: ImageVector by lazy {
        strokeVector("FileText") {
            strokePath {
                moveTo(15f, 2f)
                horizontalLineTo(6f)
                arcTo(2f, 2f, 0f, false, false, 4f, 4f)
                verticalLineTo(20f)
                arcTo(2f, 2f, 0f, false, false, 6f, 22f)
                horizontalLineTo(18f)
                arcTo(2f, 2f, 0f, false, false, 20f, 20f)
                verticalLineTo(7f)
                close()
            }
            strokePath {
                moveTo(14f, 2f)
                verticalLineTo(6f)
                arcTo(2f, 2f, 0f, false, false, 16f, 8f)
                horizontalLineTo(20f)
            }
            strokePath {
                moveTo(10f, 9f)
                horizontalLineTo(8f)
                moveTo(16f, 13f)
                horizontalLineTo(8f)
                moveTo(16f, 17f)
                horizontalLineTo(8f)
            }
        }
    }

    /** Lucide `user-round` — used in bottom nav "الحساب" and avatar */
    val UserRound: ImageVector by lazy {
        strokeVector("UserRound") {
            strokePath {
                circlePath(12f, 8f, 4f)
            }
            strokePath {
                moveTo(20f, 21f)
                arcTo(8f, 8f, 0f, false, false, 4f, 21f)
            }
        }
    }

    /** Lucide `wallet` — used in "مدفوعات" */
    val Wallet: ImageVector by lazy {
        strokeVector("Wallet") {
            strokePath {
                moveTo(19f, 7f)
                verticalLineTo(4f)
                arcTo(1f, 1f, 0f, false, false, 18f, 3f)
                horizontalLineTo(5f)
                arcTo(2f, 2f, 0f, false, false, 3f, 5f)
                verticalLineTo(19f)
                arcTo(2f, 2f, 0f, false, false, 5f, 21f)
                horizontalLineTo(19f)
                arcTo(2f, 2f, 0f, false, false, 21f, 19f)
                verticalLineTo(9f)
                arcTo(2f, 2f, 0f, false, false, 19f, 7f)
                horizontalLineTo(3f)
            }
            strokePath {
                moveTo(16f, 14f)
                horizontalLineTo(16.01f)
            }
        }
    }

    /** Lucide `receipt-text` — used in "شيكات محصلة" and "الفواتير" */
    val ReceiptText: ImageVector by lazy {
        strokeVector("ReceiptText") {
            strokePath {
                moveTo(4f, 2f)
                verticalLineTo(22f)
                lineTo(6f, 21f)
                lineTo(8f, 22f)
                lineTo(10f, 21f)
                lineTo(12f, 22f)
                lineTo(14f, 21f)
                lineTo(16f, 22f)
                lineTo(18f, 21f)
                lineTo(20f, 22f)
                verticalLineTo(2f)
                lineTo(18f, 3f)
                lineTo(16f, 2f)
                lineTo(14f, 3f)
                lineTo(12f, 2f)
                lineTo(10f, 3f)
                lineTo(8f, 2f)
                lineTo(6f, 3f)
                close()
            }
            strokePath {
                moveTo(14f, 8f)
                horizontalLineTo(8f)
                moveTo(16f, 12f)
                horizontalLineTo(8f)
                moveTo(13f, 16f)
                horizontalLineTo(8f)
            }
        }
    }

    /** Lucide `banknote` — used in "مقبوضات خزينة" and "المبيعات المسددة" */
    val Banknote: ImageVector by lazy {
        strokeVector("Banknote") {
            strokePath {
                moveTo(4f, 6f)
                horizontalLineTo(20f)
                arcTo(2f, 2f, 0f, false, true, 22f, 8f)
                verticalLineTo(16f)
                arcTo(2f, 2f, 0f, false, true, 20f, 18f)
                horizontalLineTo(4f)
                arcTo(2f, 2f, 0f, false, true, 2f, 16f)
                verticalLineTo(8f)
                arcTo(2f, 2f, 0f, false, true, 4f, 6f)
                close()
            }
            strokePath {
                circlePath(12f, 12f, 2f)
            }
            strokePath {
                moveTo(6f, 12f)
                horizontalLineTo(6.01f)
                moveTo(18f, 12f)
                horizontalLineTo(18.01f)
            }
        }
    }

    /** Lucide `users` — used in "المستحق عليهم اليوم" and "حسب العميل" */
    val Users: ImageVector by lazy {
        strokeVector("Users") {
            strokePath {
                moveTo(16f, 21f)
                verticalLineTo(19f)
                arcTo(4f, 4f, 0f, false, false, 12f, 15f)
                horizontalLineTo(6f)
                arcTo(4f, 4f, 0f, false, false, 2f, 19f)
                verticalLineTo(21f)
            }
            strokePath {
                circlePath(9f, 7f, 4f)
            }
            strokePath {
                moveTo(22f, 21f)
                verticalLineTo(19f)
                arcTo(4f, 4f, 0f, false, false, 19f, 15.13f)
                moveTo(16f, 3.13f)
                arcTo(4f, 4f, 0f, false, true, 16f, 10.88f)
            }
        }
    }

    /** Lucide `calendar-days` — used in Month picker and "حسب اليوم" */
    val CalendarDays: ImageVector by lazy {
        strokeVector("CalendarDays") {
            strokePath {
                moveTo(8f, 2f)
                verticalLineTo(6f)
                moveTo(16f, 2f)
                verticalLineTo(6f)
            }
            strokePath {
                moveTo(5f, 4f)
                horizontalLineTo(19f)
                arcTo(2f, 2f, 0f, false, true, 21f, 6f)
                verticalLineTo(20f)
                arcTo(2f, 2f, 0f, false, true, 19f, 22f)
                horizontalLineTo(5f)
                arcTo(2f, 2f, 0f, false, true, 3f, 20f)
                verticalLineTo(6f)
                arcTo(2f, 2f, 0f, false, true, 5f, 4f)
                close()
            }
            strokePath {
                moveTo(3f, 10f)
                horizontalLineTo(21f)
                moveTo(8f, 14f)
                horizontalLineTo(8.01f)
                moveTo(12f, 14f)
                horizontalLineTo(12.01f)
                moveTo(16f, 14f)
                horizontalLineTo(16.01f)
                moveTo(8f, 18f)
                horizontalLineTo(8.01f)
                moveTo(12f, 18f)
                horizontalLineTo(12.01f)
                moveTo(16f, 18f)
                horizontalLineTo(16.01f)
            }
        }
    }

    /** Lucide `package` — used in "حسب المنتج" */
    val Package: ImageVector by lazy {
        strokeVector("Package") {
            strokePath {
                moveTo(11f, 21.73f)
                arcTo(2f, 2f, 0f, false, false, 13f, 21.73f)
                lineTo(20f, 17.73f)
                arcTo(2f, 2f, 0f, false, false, 21f, 16f)
                verticalLineTo(8f)
                arcTo(2f, 2f, 0f, false, false, 20f, 6.27f)
                lineTo(13f, 2.27f)
                arcTo(2f, 2f, 0f, false, false, 11f, 2.27f)
                lineTo(4f, 6.27f)
                arcTo(2f, 2f, 0f, false, false, 3f, 8f)
                verticalLineTo(16f)
                arcTo(2f, 2f, 0f, false, false, 4f, 17.73f)
                close()
            }
            strokePath {
                moveTo(12f, 22f)
                verticalLineTo(12f)
                moveTo(3.29f, 7f)
                lineTo(12f, 12f)
                lineTo(20.71f, 7f)
                moveTo(7.5f, 4.27f)
                lineTo(16.5f, 9.42f)
            }
        }
    }

    /** Lucide `target` — used in "الهدف حتى اليوم" */
    val Target: ImageVector by lazy {
        strokeVector("Target") {
            strokePath {
                circlePath(12f, 12f, 10f)
            }
            strokePath {
                circlePath(12f, 12f, 6f)
            }
            strokePath {
                circlePath(12f, 12f, 2f)
            }
        }
    }
}
