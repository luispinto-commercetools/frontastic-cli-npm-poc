const fs = require("fs");
const os = require("os");
const tar = require("tar");
const path = require("path");
const https = require("https");
const stream = require("stream");
const unzipper = require("unzipper");

const RELEASE_VERSION = "2.4.0";
const BINARY_DISTRIBUTION_PACKAGES = {
  "darwin-x64": "darwin_amd64.tar.gz",
  "darwin-arm64": "darwin_arm64.tar.gz",
  "linux-x64": "linux_amd64.tar.gz",
  "win32-x64": "windows_amd64.zip",
};

// Windows binaries end with .exe so we need to special case them.
const binaryName = os.platform() === "win32" ? "frontastic.exe" : "frontastic";

// Determine package name for this platform
const packageName =
  BINARY_DISTRIBUTION_PACKAGES[`${os.platform()}-${os.arch()}`];

function makeRequest(url) {
  console.debug(`requesting ${url}`);
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const statusCode = response.statusCode;

        if (
          statusCode >= 300 &&
          statusCode < 400 &&
          response.headers.location
        ) {
          // Follow redirects
          makeRequest(response.headers.location).then(resolve, reject);
          return;
        }

        if (statusCode >= 200 && statusCode < 300) {
          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => {
            resolve(Buffer.concat(chunks));
          });
          return;
        }

        reject(new Error(response.statusMessage));
      })
      .on("error", reject);
  });
}

async function fetchReleaseAssets() {
  // Release assets url
  const releaseHostUrl = `https://github.com/FrontasticGmbH/frontastic-cli/releases/download`;
  const distributionAssetUrl = `${releaseHostUrl}/${RELEASE_VERSION}/frontastic-cli_${RELEASE_VERSION}_${packageName}`;

  try {
    // Download the assets
    return await makeRequest(distributionAssetUrl);
  } catch (error) {
    console.debug(error);
    throw new Error(`Failed to fetch release assets: ${distributionAssetUrl}`);
  }
}

async function unzip(fileBuffer) {
  console.debug("extracting zip file ...");
  const readStream = new stream.PassThrough();
  readStream.end(fileBuffer);
  return new Promise((resolve, reject) => {
    readStream
      .pipe(unzipper.Extract({ path: "./" }))
      .on("finish", resolve)
      .on("error", reject);
  });
}

async function untar(fileBuffer) {
  console.debug("extracting tar file ...");
  const readStream = new stream.PassThrough();
  readStream.end(fileBuffer);
  return new Promise((resolve, reject) => {
    readStream.pipe(tar.x()).on("finish", resolve).on("error", reject);
  });
}

async function downloadBinaryFromGithubReleases() {
  // Download the assets
  const fileBuffer = await fetchReleaseAssets();

  packageName.endsWith(".zip")
    ? await unzip(fileBuffer)
    : await untar(fileBuffer);

  fs.rename(binaryName, path.join("bin", binaryName), (error) => {
    if (error) {
      console.error("Error moving file:", error);
    } else {
      console.log("File moved successfully!");
    }
  });
}

downloadBinaryFromGithubReleases();
