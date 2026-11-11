import SwiftUI

@main
struct NSCommissionsApp: App {
    @StateObject private var viewModel = AppViewModel()

    var body: some Scene {
        WindowGroup {
            MainShellView(viewModel: viewModel)
        }
    }
}
