//
//  LomiraWidgetsBundle.swift
//  LomiraWidgets
//
//  Created by Sven Schipper on 24.09.26.
//

import WidgetKit
import SwiftUI

@main
struct LomiraWidgetsBundle: WidgetBundle {
    // LomiraWidgetsControl (Xcode's default Control Center "Timer" scaffold)
    // and AppIntent.swift's ConfigurationAppIntent are unrelated to this
    // design and deliberately left out of the bundle — not deleted, since
    // removing files from the target itself is a Sven/Xcode-side cleanup if
    // wanted (this project's PBXFileSystemSynchronizedRootGroup means Xcode
    // picks up on-disk deletions automatically, no pbxproj surgery needed).
    var body: some Widget {
        LomiraWidgets()
        // Live Activity for the Anker breathing exercise. The widget target's
        // own deployment target is well above 16.1 (ActivityKit's minimum),
        // so no #available guard needed here — the app-side plugin still
        // guards its own ActivityKit calls because the app target ships with
        // 15.0.
        LomiraAnkerLiveActivity()
    }
}
