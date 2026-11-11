import SwiftUI

struct MandatoryUpdateDialog: View {
    let update: AppUpdateInfo
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        ZStack {
            Color.black.opacity(0.55)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                // Header NS Badge
                ZStack {
                    RoundedRectangle(cornerRadius: 20)
                        .fill(
                            LinearGradient(
                                colors: [c.heroStart, c.heroMid, c.heroEnd],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 64, height: 64)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(c.primary.opacity(0.35), lineWidth: 1.5)
                        )

                    Image("ns_mark")
                        .resizable()
                        .renderingMode(.template)
                        .scaledToFit()
                        .foregroundColor(.white)
                        .frame(width: 36, height: 36)
                }
                .padding(.top, 4)

                Text(tr("تحديث جديد متاح للتطبيق", "App Update Available", isAr: isAr))
                    .font(.system(size: 20, weight: .heavy))
                    .foregroundColor(c.foreground)
                    .multilineTextAlignment(.center)

                Text(tr(
                    "يتوفر إصدار جديد من تطبيق عمولات المندوبين. اضغط على الزر أدناه للانتقال إلى صفحة التحميل الرسمية لتحميل وتثبيت التحديث.",
                    "A new version of the Sales Rep Commissions app is available. Tap below to visit the official download page and install the update.",
                    isAr: isAr
                ))
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(c.mutedForeground)
                .multilineTextAlignment(.center)
                .lineSpacing(3)
                .padding(.horizontal, 4)

                // Version pill
                HStack(spacing: 8) {
                    Image(systemName: "arrow.triangle.2.circlepath")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(c.primary)

                    Text("v\(update.currentVersion) → v\(update.version)")
                        .font(.system(size: 12.5, weight: .bold))
                        .foregroundColor(c.primary)
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(c.accent)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(c.primary.opacity(0.2), lineWidth: 1)
                )

                // Redirect to Official Download Page Button
                Button(action: openOfficialDownloadPage) {
                    HStack(spacing: 8) {
                        Image(systemName: "arrow.down.circle")
                            .font(.system(size: 16, weight: .bold))
                        Text(tr("تحميل الآن", "Download Now", isAr: isAr))
                            .font(.system(size: 15, weight: .bold))
                    }
                    .foregroundColor(c.primaryForeground)
                    .frame(maxWidth: .infinity)
                    .frame(height: 50)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(c.primary)
                    )
                }
                .buttonStyle(.plain)
                .padding(.top, 4)
            }
            .padding(24)
            .background(
                RoundedRectangle(cornerRadius: 26)
                    .fill(c.card)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 26)
                    .stroke(c.border, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.35), radius: 20, x: 0, y: 10)
            .padding(.horizontal, 24)
        }
    }

    private func openOfficialDownloadPage() {
        let urlStr = update.downloadPageUrl.isEmpty ? "https://ns-scw.bayoumi.dev/ar/get-app" : update.downloadPageUrl
        if let url = URL(string: urlStr) {
            UIApplication.shared.open(url)
        }
    }
}
