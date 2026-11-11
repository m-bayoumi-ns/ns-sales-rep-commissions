import os
import hashlib

def gen_id(name: str) -> str:
    # PBX uses 24-character hexadecimal IDs
    h = hashlib.sha1(name.encode("utf-8")).hexdigest().upper()
    return h[:24]

project_dir = os.path.dirname(os.path.abspath(__file__))
xcodeproj_dir = os.path.join(project_dir, "NSCommissions.xcodeproj")
os.makedirs(xcodeproj_dir, exist_ok=True)
pbxproj_path = os.path.join(xcodeproj_dir, "project.pbxproj")

# File list
source_files = [
    ("NSCommissionsApp.swift", "NSCommissionsApp.swift", None),
    ("Theme.swift", "Theme/Theme.swift", "Theme"),
    ("ApiClient.swift", "Data/ApiClient.swift", "Data"),
    ("Models.swift", "Data/Models.swift", "Data"),
    ("SessionStore.swift", "Data/SessionStore.swift", "Data"),
    ("AccountView.swift", "UI/AccountView.swift", "UI"),
    ("AppViewModel.swift", "UI/AppViewModel.swift", "UI"),
    ("BottomNavBar.swift", "UI/BottomNavBar.swift", "UI"),
    ("CommissionsView.swift", "UI/CommissionsView.swift", "UI"),
    ("Components.swift", "UI/Components.swift", "UI"),
    ("LoginView.swift", "UI/LoginView.swift", "UI"),
    ("MainShellView.swift", "UI/MainShellView.swift", "UI"),
    ("MandatoryUpdateDialog.swift", "UI/MandatoryUpdateDialog.swift", "UI"),
    ("RepDetailView.swift", "UI/RepDetailView.swift", "UI"),
]

resource_files = [
    ("Assets.xcassets", "Assets.xcassets", None),
]

support_files = [
    ("Info.plist", "Info.plist", None),
]

# Generate IDs
ID_ROOT_PROJECT = gen_id("ROOT_PROJECT")
ID_MAIN_GROUP = gen_id("MAIN_GROUP")
ID_APP_GROUP = gen_id("NSCommissions_GROUP")
ID_THEME_GROUP = gen_id("Theme_GROUP")
ID_DATA_GROUP = gen_id("Data_GROUP")
ID_UI_GROUP = gen_id("UI_GROUP")
ID_PRODUCTS_GROUP = gen_id("PRODUCTS_GROUP")

ID_PRODUCT_REF = gen_id("PRODUCT_REF_APP")
ID_TARGET = gen_id("TARGET_NSCommissions")
ID_SOURCES_PHASE = gen_id("SOURCES_PHASE")
ID_RESOURCES_PHASE = gen_id("RESOURCES_PHASE")
ID_FRAMEWORKS_PHASE = gen_id("FRAMEWORKS_PHASE")

ID_PROJECT_CONFIG_DEBUG = gen_id("PROJECT_CONFIG_DEBUG")
ID_PROJECT_CONFIG_RELEASE = gen_id("PROJECT_CONFIG_RELEASE")
ID_PROJECT_CONFIG_LIST = gen_id("PROJECT_CONFIG_LIST")

ID_TARGET_CONFIG_DEBUG = gen_id("TARGET_CONFIG_DEBUG")
ID_TARGET_CONFIG_RELEASE = gen_id("TARGET_CONFIG_RELEASE")
ID_TARGET_CONFIG_LIST = gen_id("TARGET_CONFIG_LIST")

# Map of file -> (fileRef_id, buildFile_id)
file_ids = {}
for name, rel_path, group in source_files:
    file_ids[name] = (gen_id(f"FILEREF_{name}"), gen_id(f"BUILDFILE_{name}"))

for name, rel_path, group in resource_files:
    file_ids[name] = (gen_id(f"FILEREF_{name}"), gen_id(f"BUILDFILE_{name}"))

for name, rel_path, group in support_files:
    file_ids[name] = (gen_id(f"FILEREF_{name}"), None)

content = f"""// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 56;
	objects = {{

/* Begin PBXBuildFile section */
"""

for name, rel_path, group in source_files:
    fref, bfile = file_ids[name]
    content += f"\t\t{bfile} /* {name} in Sources */ = {{isa = PBXBuildFile; fileRef = {fref} /* {name} */; }};\n"

for name, rel_path, group in resource_files:
    fref, bfile = file_ids[name]
    content += f"\t\t{bfile} /* {name} in Resources */ = {{isa = PBXBuildFile; fileRef = {fref} /* {name} */; }};\n"

content += """/* End PBXBuildFile section */

/* Begin PBXFileReference section */
"""

content += f"\t\t{ID_PRODUCT_REF} /* NSCommissions.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = NSCommissions.app; sourceTree = BUILT_PRODUCTS_DIR; }};\n"

for name, rel_path, group in source_files:
    fref, _ = file_ids[name]
    fname = os.path.basename(rel_path)
    content += f"\t\t{fref} /* {fname} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {fname}; sourceTree = \"<group>\"; }};\n"

for name, rel_path, group in resource_files:
    fref, _ = file_ids[name]
    content += f"\t\t{fref} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = folder.assetcatalog; path = {name}; sourceTree = \"<group>\"; }};\n"

for name, rel_path, group in support_files:
    fref, _ = file_ids[name]
    content += f"\t\t{fref} /* {name} */ = {{isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = {name}; sourceTree = \"<group>\"; }};\n"

content += """/* End PBXFileReference section */

/* Begin PBXFrameworksBuildPhase section */
"""

content += f"""\t\t{ID_FRAMEWORKS_PHASE} /* Frameworks */ = {{
\t\t\tisa = PBXFrameworksBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
"""

# Theme Group
theme_children = []
for name, rel_path, group in source_files:
    if group == "Theme":
        theme_children.append(f"{file_ids[name][0]} /* {name} */")

content += f"""\t\t{ID_THEME_GROUP} /* Theme */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
"""
for ch in theme_children:
    content += f"\t\t\t\t{ch},\n"
content += f"""\t\t\t);
\t\t\tpath = Theme;
\t\t\tsourceTree = "<group>";
\t\t}};
"""

# Data Group
data_children = []
for name, rel_path, group in source_files:
    if group == "Data":
        data_children.append(f"{file_ids[name][0]} /* {name} */")

content += f"""\t\t{ID_DATA_GROUP} /* Data */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
"""
for ch in data_children:
    content += f"\t\t\t\t{ch},\n"
content += f"""\t\t\t);
\t\t\tpath = Data;
\t\t\tsourceTree = "<group>";
\t\t}};
"""

# UI Group
ui_children = []
for name, rel_path, group in source_files:
    if group == "UI":
        ui_children.append(f"{file_ids[name][0]} /* {name} */")

content += f"""\t\t{ID_UI_GROUP} /* UI */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
"""
for ch in ui_children:
    content += f"\t\t\t\t{ch},\n"
content += f"""\t\t\t);
\t\t\tpath = UI;
\t\t\tsourceTree = "<group>";
\t\t}};
"""

# NSCommissions App Group
app_children = [
    f"{file_ids['NSCommissionsApp.swift'][0]} /* NSCommissionsApp.swift */",
    f"{ID_THEME_GROUP} /* Theme */",
    f"{ID_DATA_GROUP} /* Data */",
    f"{ID_UI_GROUP} /* UI */",
    f"{file_ids['Assets.xcassets'][0]} /* Assets.xcassets */",
    f"{file_ids['Info.plist'][0]} /* Info.plist */",
]

content += f"""\t\t{ID_APP_GROUP} /* NSCommissions */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
"""
for ch in app_children:
    content += f"\t\t\t\t{ch},\n"
content += f"""\t\t\t);
\t\t\tpath = NSCommissions;
\t\t\tsourceTree = "<group>";
\t\t}};
"""

# Products Group
content += f"""\t\t{ID_PRODUCTS_GROUP} /* Products */ = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{ID_PRODUCT_REF} /* NSCommissions.app */,
\t\t\t);
\t\t\tname = Products;
\t\t\tsourceTree = "<group>";
\t\t}};
"""

# Main Group
content += f"""\t\t{ID_MAIN_GROUP} = {{
\t\t\tisa = PBXGroup;
\t\t\tchildren = (
\t\t\t\t{ID_APP_GROUP} /* NSCommissions */,
\t\t\t\t{ID_PRODUCTS_GROUP} /* Products */,
\t\t\t);
\t\t\tsourceTree = "<group>";
\t\t}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
\t\t{ID_TARGET} /* NSCommissions */ = {{
\t\t\tisa = PBXNativeTarget;
\t\t\tbuildConfigurationList = {ID_TARGET_CONFIG_LIST} /* Build configuration list for PBXNativeTarget "NSCommissions" */;
\t\t\tbuildPhases = (
\t\t\t\t{ID_SOURCES_PHASE} /* Sources */,
\t\t\t\t{ID_FRAMEWORKS_PHASE} /* Frameworks */,
\t\t\t\t{ID_RESOURCES_PHASE} /* Resources */,
\t\t\t);
\t\t\tbuildRules = (
\t\t\t);
\t\t\tdependencies = (
\t\t\t);
\t\t\tname = NSCommissions;
\t\t\tproductName = NSCommissions;
\t\t\tproductReference = {ID_PRODUCT_REF} /* NSCommissions.app */;
\t\t\tproductType = "com.apple.product-type.application";
\t\t}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
\t\t{ID_ROOT_PROJECT} /* Project object */ = {{
\t\t\tisa = PBXProject;
\t\t\tattributes = {{
\t\t\t\tBuildIndependentTargetsInParallel = 1;
\t\t\t\tLastSwiftUpdateCheck = 1500;
\t\t\t\tLastUpgradeCheck = 1500;
\t\t\t\tTargetAttributes = {{
\t\t\t\t\t{ID_TARGET} = {{
\t\t\t\t\t\tCreatedOnToolsVersion = 15.0;
\t\t\t\t\t}};
\t\t\t\t}};
\t\t\t}};
\t\t\tbuildConfigurationList = {ID_PROJECT_CONFIG_LIST} /* Build configuration list for PBXProject "NSCommissions" */;
\t\t\tcompatibilityVersion = "Xcode 14.0";
\t\t\tdevelopmentRegion = ar;
\t\t\thasScannedForEncodings = 0;
\t\t\tknownRegions = (
\t\t\t\tar,
\t\t\t\ten,
\t\t\t\tBase,
\t\t\t);
\t\t\tmainGroup = {ID_MAIN_GROUP};
\t\t\tproductRefGroup = {ID_PRODUCTS_GROUP} /* Products */;
\t\t\tprojectDirPath = "";
\t\t\tprojectRoot = "";
\t\t\ttargets = (
\t\t\t\t{ID_TARGET} /* NSCommissions */,
\t\t\t);
\t\t}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
\t\t{ID_RESOURCES_PHASE} /* Resources */ = {{
\t\t\tisa = PBXResourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
"""

for name, rel_path, group in resource_files:
    fref, bfile = file_ids[name]
    content += f"\t\t\t\t{bfile} /* {name} in Resources */,\n"

content += f"""\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
\t\t{ID_SOURCES_PHASE} /* Sources */ = {{
\t\t\tisa = PBXSourcesBuildPhase;
\t\t\tbuildActionMask = 2147483647;
\t\t\tfiles = (
"""

for name, rel_path, group in source_files:
    fref, bfile = file_ids[name]
    content += f"\t\t\t\t{bfile} /* {name} in Sources */,\n"

content += f"""\t\t\t);
\t\t\trunOnlyForDeploymentPostprocessing = 0;
\t\t}};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
\t\t{ID_PROJECT_CONFIG_DEBUG} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ANALYZER_NONNULL = YES;
\t\t\t\tCLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
\t\t\t\tCLANG_ENABLE_MODULES = YES;
\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;
\t\t\t\tCLANG_ENABLE_OBJC_WEAK = YES;
\t\t\t\tCOPY_PHASE_STRIP = NO;
\t\t\t\tDEBUG_INFORMATION_FORMAT = dwarf;
\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;
\t\t\t\tENABLE_TESTABILITY = YES;
\t\t\t\tGCC_C_LANGUAGE_STANDARD = gnu11;
\t\t\t\tGCC_DYNAMIC_NO_PIC = NO;
\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;
\t\t\t\tGCC_OPTIMIZATION_LEVEL = 0;
\t\t\t\tGCC_PREPROCESSOR_DEFINITIONS = (
\t\t\t\t\t"DEBUG=1",
\t\t\t\t\t"$(inherited)",
\t\t\t\t);
\t\t\t\tGCC_WARN_64_TO_32_BIT_CONVERSION = YES;
\t\t\t\tGCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
\t\t\t\tGCC_WARN_UNDEFINED_VARIABLES = YES;
\t\t\t\tGCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
\t\t\t\tGCC_WARN_UNUSED_FUNCTION = YES;
\t\t\t\tGCC_WARN_UNUSED_VARIABLE = YES;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tMTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
\t\t\t\tMTL_FAST_MATH = YES;
\t\t\t\tONLY_ACTIVE_ARCH = YES;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG;
\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = "-Onone";
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{ID_PROJECT_CONFIG_RELEASE} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tALWAYS_SEARCH_USER_PATHS = NO;
\t\t\t\tCLANG_ANALYZER_NONNULL = YES;
\t\t\t\tCLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE;
\t\t\t\tCLANG_CXX_LANGUAGE_STANDARD = "gnu++20";
\t\t\t\tCLANG_ENABLE_MODULES = YES;
\t\t\t\tCLANG_ENABLE_OBJC_ARC = YES;
\t\t\t\tCLANG_ENABLE_OBJC_WEAK = YES;
\t\t\t\tCOPY_PHASE_STRIP = NO;
\t\t\t\tDEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
\t\t\t\tENABLE_NS_ASSERTIONS = NO;
\t\t\t\tENABLE_STRICT_OBJC_MSGSEND = YES;
\t\t\t\tGCC_C_LANGUAGE_STANDARD = gnu11;
\t\t\t\tGCC_NO_COMMON_BLOCKS = YES;
\t\t\t\tGCC_WARN_64_TO_32_BIT_CONVERSION = YES;
\t\t\t\tGCC_WARN_ABOUT_RETURN_TYPE = YES_ERROR;
\t\t\t\tGCC_WARN_UNDEFINED_VARIABLES = YES;
\t\t\t\tGCC_WARN_UNINITIALIZED_AUTOS = YES_AGGRESSIVE;
\t\t\t\tGCC_WARN_UNUSED_FUNCTION = YES;
\t\t\t\tGCC_WARN_UNUSED_VARIABLE = YES;
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tMTL_ENABLE_DEBUG_INFO = NO;
\t\t\t\tMTL_FAST_MATH = YES;
\t\t\t\tSDKROOT = iphoneos;
\t\t\t\tSWIFT_COMPILATION_MODE = "wholemodule";
\t\t\t\tSWIFT_OPTIMIZATION_LEVEL = "-O";
\t\t\t\tVALIDATE_PRODUCT = YES;
\t\t\t}};
\t\t\tname = Release;
\t\t}};
\t\t{ID_TARGET_CONFIG_DEBUG} /* Debug */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 27;
\t\t\t\tDEVELOPMENT_ASSET_PATHS = "";
\t\t\t\tENABLE_PREVIEWS = YES;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = NSCommissions/Info.plist;
\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = "عمولات نجيب سليم";
\t\t\t\tINFOPLIST_KEY_LSApplicationQueriesSchemes = whatsapp;
\t\t\t\tINFOPLIST_KEY_NSFaceIDUsageDescription = "تسجيل الدخول السريع باستخدام البصمة أو التعرف على الوجه";
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 2.0.27;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.naguibselim.commissionsapp;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t}};
\t\t\tname = Debug;
\t\t}};
\t\t{ID_TARGET_CONFIG_RELEASE} /* Release */ = {{
\t\t\tisa = XCBuildConfiguration;
\t\t\tbuildSettings = {{
\t\t\t\tASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;
\t\t\t\tASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = AccentColor;
\t\t\t\tCODE_SIGN_STYLE = Automatic;
\t\t\t\tCURRENT_PROJECT_VERSION = 27;
\t\t\t\tDEVELOPMENT_ASSET_PATHS = "";
\t\t\t\tENABLE_PREVIEWS = YES;
\t\t\t\tGENERATE_INFOPLIST_FILE = NO;
\t\t\t\tINFOPLIST_FILE = NSCommissions/Info.plist;
\t\t\t\tINFOPLIST_KEY_CFBundleDisplayName = "عمولات نجيب سليم";
\t\t\t\tINFOPLIST_KEY_LSApplicationQueriesSchemes = whatsapp;
\t\t\t\tINFOPLIST_KEY_NSFaceIDUsageDescription = "تسجيل الدخول السريع باستخدام البصمة أو التعرف على الوجه";
\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 16.0;
\t\t\t\tLD_RUNPATH_SEARCH_PATHS = (
\t\t\t\t\t"$(inherited)",
\t\t\t\t\t"@executable_path/Frameworks",
\t\t\t\t);
\t\t\t\tMARKETING_VERSION = 2.0.27;
\t\t\t\tPRODUCT_BUNDLE_IDENTIFIER = com.naguibselim.commissionsapp;
\t\t\t\tPRODUCT_NAME = "$(TARGET_NAME)";
\t\t\t\tSWIFT_EMIT_LOC_STRINGS = YES;
\t\t\t\tSWIFT_VERSION = 5.0;
\t\t\t\tTARGETED_DEVICE_FAMILY = "1,2";
\t\t\t}};
\t\t\tname = Release;
\t\t}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
\t\t{ID_PROJECT_CONFIG_LIST} /* Build configuration list for PBXProject "NSCommissions" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{ID_PROJECT_CONFIG_DEBUG} /* Debug */,
\t\t\t\t{ID_PROJECT_CONFIG_RELEASE} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
\t\t{ID_TARGET_CONFIG_LIST} /* Build configuration list for PBXNativeTarget "NSCommissions" */ = {{
\t\t\tisa = XCConfigurationList;
\t\t\tbuildConfigurations = (
\t\t\t\t{ID_TARGET_CONFIG_DEBUG} /* Debug */,
\t\t\t\t{ID_TARGET_CONFIG_RELEASE} /* Release */,
\t\t\t);
\t\t\tdefaultConfigurationIsVisible = 0;
\t\t\tdefaultConfigurationName = Release;
\t\t}};
/* End XCConfigurationList section */

	}};
	rootObject = {ID_ROOT_PROJECT} /* Project object */;
}}
"""

with open(pbxproj_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated successfully: {pbxproj_path}")
