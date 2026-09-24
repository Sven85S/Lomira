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
    }
}
