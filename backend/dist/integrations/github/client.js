import { Octokit } from "@octokit/rest";
let _octokit = null;
export function getOctokit() {
    if (!_octokit) {
        const token = process.env.GITHUBTOKEN;
        if (!token)
            throw new Error("Missing GITHUBTOKEN environment variable");
        _octokit = new Octokit({ auth: token });
    }
    return _octokit;
}
//# sourceMappingURL=client.js.map