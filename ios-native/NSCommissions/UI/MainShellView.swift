import SwiftUI

struct MainShellView: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.colorScheme) private var systemColorScheme

    var body: some View {
        let isDark = viewModel.themeMode == "dark" || (viewModel.themeMode == "system" && systemColorScheme == .dark)
        let colors = isDark ? NsColors.dark : NsColors.light
        let isAr = viewModel.isArabic

        ZStack(alignment: .bottom) {
            if !viewModel.signedIn {
                LoginView(viewModel: viewModel)
            } else {
                VStack(spacing: 0) {
                    Group {
                        switch viewModel.activeDestination {
                        case .commissions:
                            CommissionsView(viewModel: viewModel)
                        case .account:
                            AccountView(viewModel: viewModel)
                        default:
                            CommissionsView(viewModel: viewModel)
                        }
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)

                    // Bottom Navigation Bar
                    BottomNavBar(viewModel: viewModel)
                }
                .ignoresSafeArea(.keyboard, edges: .bottom)
            }

            // Mandatory Update Pop-up Box Modal Overlay
            if let update = viewModel.mandatoryUpdate {
                MandatoryUpdateDialog(
                    update: update,
                    onDismiss: { viewModel.dismissUpdateDialog() },
                    onRecheck: {
                        Task { await viewModel.checkMandatoryUpdate() }
                    }
                )
                .transition(.opacity)
                .zIndex(100)
            }
        }
        .environment(\.nsColors, colors)
        .environment(\.isArabic, isAr)
        .environment(\.layoutDirection, isAr ? .rightToLeft : .leftToRight)
        .preferredColorScheme(viewModel.themeMode == "system" ? nil : (isDark ? .dark : .light))
    }
}
