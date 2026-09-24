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
    var body: some Widget {
        LomiraWidgets()
        LomiraWidgetsControl()
    }
}
