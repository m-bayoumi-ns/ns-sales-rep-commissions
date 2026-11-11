import SwiftUI

struct CommissionsView: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        ZStack {
            c.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Top App Bar
                HStack(spacing: 12) {
                    // Notifications Bell Button
                    Button(action: {
                        viewModel.openNotifications()
                    }) {
                        ZStack(alignment: .topTrailing) {
                            ZStack {
                                Circle()
                                    .fill(c.muted)
                                    .frame(width: 38, height: 38)
                                    .overlay(Circle().stroke(c.border, lineWidth: 1))

                                Image(systemName: "bell")
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(c.foreground)
                            }

                            if let unread = viewModel.notificationsPayload?.unread, unread > 0 {
                                Circle()
                                    .fill(c.destructive)
                                    .frame(width: 10, height: 10)
                                    .offset(x: 1, y: 1)
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    // Month Selector Dropdown
                    if let data = viewModel.commissionsData, !data.months.isEmpty {
                        Menu {
                            ForEach(data.months, id: \.self) { m in
                                Button(action: { viewModel.selectMonth(m) }) {
                                    HStack {
                                        Text(Format.monthLabel(m, isAr: isAr))
                                        if m == viewModel.selectedMonth {
                                            Image(systemName: "checkmark")
                                        }
                                    }
                                }
                            }
                        } label: {
                            HStack(spacing: 6) {
                                Image(systemName: "calendar")
                                    .font(.system(size: 13, weight: .bold))
                                    .foregroundColor(c.primary)

                                Text(Format.monthLabel(viewModel.selectedMonth ?? data.clock.month, isAr: isAr))
                                    .font(.system(size: 13.5, weight: .bold))
                                    .foregroundColor(c.foreground)

                                Image(systemName: "chevron.down")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundColor(c.mutedForeground)
                            }
                            .padding(.horizontal, 12)
                            .frame(height: 38)
                            .background(RoundedRectangle(cornerRadius: 19).fill(c.card))
                            .overlay(RoundedRectangle(cornerRadius: 19).stroke(c.border, lineWidth: 1))
                        }
                    }

                    Spacer()

                    // Circular Lightbulb Theme Switcher (with spring animation)
                    LightbulbThemeButton(isDark: c.isDark) {
                        viewModel.toggleTheme()
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(c.card.opacity(0.85).background(.ultraThinMaterial))
                .overlay(Rectangle().frame(height: 1).foregroundColor(c.border.opacity(0.6)), alignment: .bottom)

                // Scrollable Body
                ScrollView {
                    VStack(spacing: 14) {
                        // Offline Notice Banner
                        if let data = viewModel.commissionsData, data.isOfflineCache {
                            HStack(spacing: 8) {
                                Image(systemName: "wifi.slash")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(c.warning)

                                Text(tr("بيانات محفوظة دون اتصال (أوفلاين)", "Cached offline data", isAr: isAr))
                                    .font(.system(size: 12.5, weight: .semibold))
                                    .foregroundColor(c.warning)

                                Spacer()
                            }
                            .padding(12)
                            .background(RoundedRectangle(cornerRadius: 14).fill(c.warningSoft))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(c.warning.opacity(0.3), lineWidth: 1))
                            .padding(.horizontal, 16)
                            .padding(.top, 10)
                        }

                        // Rep Selector (if user has access to multiple reps)
                        if let data = viewModel.commissionsData, data.repOptions.count > 1 {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ForEach(data.repOptions) { rep in
                                        let isSel = rep.key == viewModel.selectedRep
                                        Button(action: { viewModel.selectRep(rep.key) }) {
                                            Text(rep.name)
                                                .font(.system(size: 12.5, weight: isSel ? .bold : .medium))
                                                .foregroundColor(isSel ? c.primaryForeground : c.foreground)
                                                .padding(.horizontal, 14)
                                                .frame(height: 34)
                                                .background(
                                                    RoundedRectangle(cornerRadius: 17)
                                                        .fill(isSel ? c.primary : c.card)
                                                )
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 17)
                                                        .stroke(isSel ? c.primary : c.border, lineWidth: 1)
                                                )
                                        }
                                        .buttonStyle(.plain)
                                    }
                                }
                                .padding(.horizontal, 16)
                            }
                            .padding(.top, 4)
                        }

                        // Detail or Loading
                        if let data = viewModel.commissionsData, let detail = data.detail {
                            RepDetailView(
                                detail: detail,
                                settings: data.settings,
                                clock: data.clock,
                                section: viewModel.activeSection,
                                viewModel: viewModel
                            )
                            .padding(.horizontal, 16)
                            .padding(.bottom, 24)
                        } else if viewModel.loadingCommissions {
                            CenteredNsLoader()
                                .frame(height: 380)
                        } else if let error = viewModel.commissionsError {
                            VStack(spacing: 12) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.system(size: 32))
                                    .foregroundColor(c.warning)
                                Text(tr("تعذر تحميل بيانات العمولات", "Could not load commissions", isAr: isAr))
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundColor(c.foreground)
                                Button(action: {
                                    Task { await viewModel.loadCommissions(month: nil, rep: nil) }
                                }) {
                                    Text(tr("إعادة المحاولة", "Try again", isAr: isAr))
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(c.primaryForeground)
                                        .padding(.horizontal, 20)
                                        .frame(height: 42)
                                        .background(RoundedRectangle(cornerRadius: 12).fill(c.primary))
                                }
                            }
                            .padding(32)
                        }
                    }
                    .padding(.top, 6)
                }
                .refreshable {
                    await viewModel.loadCommissions(month: nil, rep: nil)
                }
            }
        }
        .sheet(isPresented: $viewModel.notificationsOpen) {
            NotificationsSheetView(viewModel: viewModel)
        }
    }
}

// MARK: - Notifications Sheet View

private struct NotificationsSheetView: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.dismiss) private var dismiss
    @Environment(\.nsColors) private var c
    @Environment(\.isArabic) private var isAr

    var body: some View {
        NavigationView {
            ZStack {
                c.background.ignoresSafeArea()

                if let payload = viewModel.notificationsPayload, !payload.items.isEmpty {
                    ScrollView {
                        VStack(spacing: 12) {
                            ForEach(payload.items) { item in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(item.month)
                                            .font(.system(size: 13, weight: .bold))
                                            .foregroundColor(c.primary)
                                        Spacer()
                                        Text(item.at)
                                            .font(.system(size: 11))
                                            .foregroundColor(c.mutedForeground)
                                    }

                                    if let note = item.note, !note.isEmpty {
                                        Text(note)
                                            .font(.system(size: 13))
                                            .foregroundColor(c.foreground)
                                    }

                                    ForEach(Array(item.changes.enumerated()), id: \.offset) { _, ch in
                                        Text("• \(ch.kind): \(ch.from ?? "") → \(ch.to ?? "")")
                                            .font(.system(size: 12))
                                            .foregroundColor(c.mutedForeground)
                                    }
                                }
                                .padding(14)
                                .background(RoundedRectangle(cornerRadius: 16).fill(c.card))
                                .overlay(RoundedRectangle(cornerRadius: 16).stroke(c.border, lineWidth: 1))
                            }
                        }
                        .padding(16)
                    }
                } else {
                    VStack(spacing: 10) {
                        Image(systemName: "bell.slash")
                            .font(.system(size: 32))
                            .foregroundColor(c.mutedForeground)
                        Text(tr("لا توجد إشعارات جديدة", "No new notifications", isAr: isAr))
                            .font(.system(size: 15, weight: .medium))
                            .foregroundColor(c.mutedForeground)
                    }
                    .padding(32)
                }
            }
            .navigationTitle(tr("الإشعارات والتحديثات", "Notifications", isAr: isAr))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(tr("إغلاق", "Close", isAr: isAr)) {
                        dismiss()
                    }
                    .foregroundColor(c.primary)
                }
            }
        }
    }
}
