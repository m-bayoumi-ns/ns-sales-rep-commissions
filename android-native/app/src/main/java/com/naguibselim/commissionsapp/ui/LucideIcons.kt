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
     * WhatsApp Brand Vector Icon
     */
    val WhatsApp: ImageVector by lazy {
        strokeVector("WhatsApp") {
            // Speech bubble outline with tail
            strokePath(1.9f) {
                moveTo(12f, 3f)
                arcTo(8.5f, 8.5f, 0f, false, true, 20.5f, 11.5f)
                arcTo(8.5f, 8.5f, 0f, false, true, 12f, 20f)
                curveTo(10.5f, 20f, 9.1f, 19.6f, 7.8f, 18.8f)
                lineTo(3.5f, 20.5f)
                lineTo(5.2f, 16.2f)
                curveTo(4.3f, 14.8f, 3.5f, 13.2f, 3.5f, 11.5f)
                arcTo(8.5f, 8.5f, 0f, false, true, 12f, 3f)
            }
            // Handset silhouette inside
            strokePath(1.8f) {
                moveTo(9f, 8.5f)
                curveTo(8.7f, 8.8f, 8.5f, 9.2f, 8.5f, 9.7f)
                curveTo(8.5f, 10.7f, 9.1f, 11.8f, 10.2f, 12.9f)
                curveTo(11.3f, 14.0f, 12.4f, 14.6f, 13.4f, 14.6f)
                curveTo(13.9f, 14.6f, 14.3f, 14.4f, 14.6f, 14.1f)
                lineTo(13.5f, 12.8f)
                curveTo(13.3f, 12.6f, 13.0f, 12.6f, 12.8f, 12.8f)
                lineTo(12.3f, 13.3f)
                curveTo(11.8f, 13.0f, 11.0f, 12.2f, 10.7f, 11.7f)
                lineTo(11.2f, 11.2f)
                curveTo(11.4f, 11.0f, 11.4f, 10.7f, 11.2f, 10.5f)
                close()
            }
        }
    }

    /**
     * Biometric / Fingerprint Vector Icon (Official Google Material Biometric Icon)
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
     * Updated Modern Sales Icon (`ChartNoAxesCombined` — Rising Sales Bars + Upward Trend Arrow) —
     * used in bottom nav "المبيعات".
     */
    val ShoppingCart: ImageVector by lazy {
        strokeVector("SalesTrendChart") {
            // Rising sales bars at base
            strokePath {
                moveTo(5f, 21f)
                verticalLineTo(16f)
                moveTo(11f, 21f)
                verticalLineTo(13f)
                moveTo(17f, 21f)
                verticalLineTo(10f)
            }
            // Upward trend line with arrow head
            strokePath {
                moveTo(3f, 11.5f)
                lineTo(8.5f, 6.5f)
                lineTo(12.5f, 9.5f)
                lineTo(20f, 3f)
            }
            strokePath {
                moveTo(15.5f, 3f)
                horizontalLineTo(20f)
                verticalLineTo(7.5f)
            }
        }
    }

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
