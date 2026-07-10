//
//  noop.swift
//  host
//
//  Intentionally empty. Its only purpose is to mark the host app target as
//  containing Swift so Xcode links the Swift standard library and the Swift
//  back-deployment compatibility archives (libswiftCompatibility*.a).
//
//  Without this, statically-linked Swift pods (e.g. JWTDecode, SwiftyRSA)
//  emit an unresolved `__swift_FORCE_LOAD_$_swiftCompatibility56` symbol at
//  link time. Do not delete unless the host target gains its own Swift files.
//

import Foundation
