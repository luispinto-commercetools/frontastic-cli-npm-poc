const fs = require("fs");
const os = require("os");
const tar = require("tar");
const path = require("path");
const https = require("https");
const yauzl = require("yauzl");
const stream = require("stream");

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
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(
      fileBuffer,
      { lazyEntries: true },
      function (err, zipfile) {
        if (err) throw err;
        zipfile.on("entry", (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory file names end with '/'.
            // Note that entries for directories themselves are optional.
            // An entry's fileName implicitly requires its parent directories to exist.
            zipfile.readEntry();
          } else {
            // file entry
            fs.mkdir(
              path.dirname(entry.fileName),
              { recursive: true },
              (err) => {
                if (err) reject(err);
                zipfile.openReadStream(entry, (err, readStream) => {
                  if (err) reject(err);
                  const writeStream = fs.createWriteStream(entry.fileName);
                  readStream.pipe(writeStream);
                  writeStream.on("close", () => {
                    zipfile.readEntry();
                  });
                });
              }
            );
          }
        });
        zipfile.on("end", resolve);
        zipfile.readEntry();
      }
    );
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

  fs.rename(
    path.join(__dirname, binaryName),
    path.join(__dirname, "bin", binaryName),
    (error) => {
      if (error) {
        console.error("Error moving file:", error);
      } else {
        console.log("File moved successfully!");
      }
    }
  );
}

downloadBinaryFromGithubReleases();
