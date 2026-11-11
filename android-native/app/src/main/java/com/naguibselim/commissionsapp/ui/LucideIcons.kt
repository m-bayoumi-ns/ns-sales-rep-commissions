package com.naguibselim.commissionsapp.ui

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

object LucideIcons {
    private fun strokeVector(
        name: String,
        strokeWidth: Float = 2f,
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
        pathBuilder: androidx.compose.ui.graphics.vector.PathBuilder.() -> Unit
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

    /** Lucide `hand-coins` — used in bottom nav "التحصيل" and Collections header */
    val HandCoins: ImageVector by lazy {
        strokeVector("HandCoins") {
            // Hand palm & fingers
            strokePath {
                moveTo(11f, 15f)
                horizontalLineTo(13f)
                arcTo(2f, 2f, 0f, false, false, 15f, 13f)
                verticalLineTo(12.5f)
                arcTo(1.5f, 1.5f, 0f, false, false, 13.5f, 11f)
                horizontalLineTo(8.5f)
                curveTo(7.4f, 11f, 6.4f, 11.4f, 5.7f, 12.1f)
                lineTo(2f, 16f)
            }
            strokePath {
                moveTo(7f, 21f)
                lineTo(8.6f, 19.6f)
                curveTo(9.3f, 19f, 10.2f, 18.7f, 11.1f, 18.7f)
                horizontalLineTo(15f)
                curveTo(16.1f, 18.7f, 17.1f, 18.3f, 17.8f, 17.5f)
                lineTo(21.4f, 13.9f)
                arcTo(1.5f, 1.5f, 0f, false, false, 19.3f, 11.8f)
                lineTo(16.5f, 14f)
            }
            strokePath {
                moveTo(2f, 16f)
                lineTo(7f, 21f)
            }
            // Top coin (circle at 16, 6, r = 2.5)
            strokePath {
                moveTo(18.5f, 6f)
                arcTo(2.5f, 2.5f, 0f, true, true, 13.5f, 6f)
                arcTo(2.5f, 2.5f, 0f, true, true, 18.5f, 6f)
            }
            // Second coin (circle at 9.5, 5, r = 2.2)
            strokePath {
                moveTo(11.7f, 5f)
                arcTo(2.2f, 2.2f, 0f, true, true, 7.3f, 5f)
                arcTo(2.2f, 2.2f, 0f, true, true, 11.7f, 5f)
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

    /** Lucide `shopping-cart` — used in bottom nav "المبيعات" */
    val ShoppingCart: ImageVector by lazy {
        strokeVector("ShoppingCart") {
            strokePath {
                moveTo(9f, 21f)
                arcTo(1f, 1f, 0f, true, true, 7f, 21f)
                arcTo(1f, 1f, 0f, true, true, 9f, 21f)
            }
            strokePath {
                moveTo(20f, 21f)
                arcTo(1f, 1f, 0f, true, true, 18f, 21f)
                arcTo(1f, 1f, 0f, true, true, 20f, 21f)
            }
            strokePath {
                moveTo(2.05f, 2.05f)
                horizontalLineTo(4.05f)
                lineTo(6.71f, 14.47f)
                arcTo(2f, 2f, 0f, false, false, 8.71f, 16.05f)
                horizontalLineTo(18.49f)
                arcTo(2f, 2f, 0f, false, false, 20.44f, 14.48f)
                lineTo(22.09f, 7.05f)
                horizontalLineTo(5.12f)
            }
        }
    }

    /** Lucide `user-round` — used in bottom nav "الحساب" and avatar */
    val UserRound: ImageVector by lazy {
        strokeVector("UserRound") {
            strokePath {
                moveTo(16f, 8f)
                arcTo(4f, 4f, 0f, true, true, 8f, 8f)
                arcTo(4f, 4f, 0f, true, true, 16f, 8f)
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
                moveTo(14f, 12f)
                arcTo(2f, 2f, 0f, true, true, 10f, 12f)
                arcTo(2f, 2f, 0f, true, true, 14f, 12f)
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
                moveTo(13f, 7f)
                arcTo(4f, 4f, 0f, true, true, 5f, 7f)
                arcTo(4f, 4f, 0f, true, true, 13f, 7f)
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
                moveTo(22f, 12f)
                arcTo(10f, 10f, 0f, true, true, 2f, 12f)
                arcTo(10f, 10f, 0f, true, true, 22f, 12f)
            }
            strokePath {
                moveTo(18f, 12f)
                arcTo(6f, 6f, 0f, true, true, 6f, 12f)
                arcTo(6f, 6f, 0f, true, true, 18f, 12f)
            }
            strokePath {
                moveTo(14f, 12f)
                arcTo(2f, 2f, 0f, true, true, 10f, 12f)
                arcTo(2f, 2f, 0f, true, true, 14f, 12f)
            }
        }
    }
}
