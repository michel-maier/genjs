import {
    AbstractPackage,
    GitIgnoreTemplate,
    LicenseTemplate,
    MakefileTemplate,
    ReadmeTemplate,
    TerraformToVarsTemplate,
    BuildableBehaviour,
    InstallableBehaviour,
    DeployableBehaviour,
    ServableBehaviour,
    GenerateEnvLocalableBehaviour,
    StartableBehaviour,
    ValidatableBehaviour,
    TestableBehaviour,
} from '@genjs/genjs';

export default class Package extends AbstractPackage {
    protected getBehaviours() {
        return [
            new BuildableBehaviour(),
            new InstallableBehaviour(),
            new DeployableBehaviour(),
            new GenerateEnvLocalableBehaviour(),
            new StartableBehaviour(),
            new ServableBehaviour(),
            new TestableBehaviour(),
            new ValidatableBehaviour(),
        ]
    }
    protected getTemplateRoot(): string {
        return `${__dirname}/../templates`;
    }
    // noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
    protected buildDefaultVars(vars: any): any {
        return {
            project_prefix: 'mycompany',
            project_name: 'myproject',
        };
    }
    protected async buildDynamicFiles(vars: any, cfg: any): Promise<any> {
        return {
            ['LICENSE.md']: this.buildLicense(vars),
            ['README.md']: this.buildReadme(vars),
            ['.gitignore']: this.buildGitIgnore(vars),
            ['Makefile']: this.buildMakefile(vars),
            ['terraform-to-vars.json']: this.buildTerraformToVars(vars),
        };
    }
    protected buildLicense(vars: any): LicenseTemplate {
        return new LicenseTemplate(vars);
    }
    protected buildReadme(vars: any): ReadmeTemplate {
        return new ReadmeTemplate(vars)
            .addFragmentFromTemplate(`${__dirname}/../templates/readme/original.md.ejs`)
        ;
    }
    protected buildGitIgnore(vars: any): GitIgnoreTemplate {
        return GitIgnoreTemplate.create(vars)
            .addComment('See https://help.github.com/articles/ignoring-files/ for more about ignoring files.')
            .addGroup('dependencies', [
                '/node_modules', '/.pnp', '.pnp.js',
            ])
            .addGroup('testing', [
                '/coverage',
            ])
            .addGroup('next.js', [
                '/.next/',
                '/out/',
            ])
            .addGroup('production', [
                '/build',
            ])
            .addGroup('misc', [
                '.DS_Store',
            ])
            .addGroup('debug', [
                'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*',
            ])
            .addGroup('local env files', [
                '.env.local', '.env.development.local', '.env.test.local', '.env.production.local', '*.pem',
            ])
        ;
    }
    protected buildMakefile(vars: any): MakefileTemplate {
        const t = new MakefileTemplate({relativeToRoot: this.relativeToRoot, makefile: false !== vars.makefile, ...(vars.makefile || {})})
            .addGlobalVar('prefix', vars.project_prefix)
            .addGlobalVar('bucket_prefix', vars.bucket_prefix ? vars.bucket_prefix : `$(prefix)-${vars.project_name}`)
            .addGlobalVar('env', 'dev')
            .addGlobalVar('AWS_PROFILE', `${vars.aws_profile_prefix || '$(prefix)'}-$(env)`)
            .addGlobalVar('bucket', vars.bucket ? vars.bucket : `$(env)-$(bucket_prefix)-${vars.name}`)
            .addGlobalVar('cloudfront', vars.cloudfront ? vars.cloudfront : `$(AWS_CLOUDFRONT_DISTRIBUTION_ID_${vars.name.toUpperCase()})`)
            .setDefaultTarget('install')
            .addPredefinedTarget('install', 'yarn-install')
            .addPredefinedTarget('build', 'yarn-build', {sourceLocalEnvLocal: vars.sourceLocalEnvLocal})
            .addPredefinedTarget('deploy-code', 'aws-s3-sync', {source: 'public/'})
            .addPredefinedTarget('invalidate-cache', 'aws-cloudfront-create-invalidation')
            .addMetaTarget('deploy', ['deploy-code', 'invalidate-cache'])
            .addPredefinedTarget('generate-env-local', 'generate-env-local', {prefix: 'NEXT'})
            .addPredefinedTarget('start', 'yarn-dev', {options: {p: this.getParameter('startPort')}, sourceLocalEnvLocal: vars.sourceLocalEnvLocal})
            .addPredefinedTarget('serve', 'yarn-start', {options: {p: this.getParameter('servePort')}, sourceLocalEnvLocal: vars.sourceLocalEnvLocal})
            .addPredefinedTarget('test', 'yarn-test-jest', {ci: true, coverage: false})
            .addPredefinedTarget('test-dev', 'yarn-test-jest', {local: true, all: true, coverage: false, color: true})
            .addPredefinedTarget('test-cov', 'yarn-test-jest', {local: true})
            .addPredefinedTarget('test-ci', 'yarn-test-jest', {ci: true, coverage: false})
            .addPredefinedTarget('validate', 'yarn-lint')
        ;
        if (vars.publish_image) {
            t
                .addPredefinedTarget('build-publish-image', 'docker-build', {tag: vars.publish_image.tag, path: vars.publish_image.dir || '.', buildArgs: vars.publish_image.buildArgs || {}})
                .addPredefinedTarget('deploy-publish-image', 'docker-push', {...vars.publish_image})
                .addPredefinedTarget('build-code', 'yarn-build', {sourceLocalEnvLocal: vars.sourceLocalEnvLocal})
                .addMetaTarget('build', vars.publish_image.noPreBuildCode ? ['build-publish-image'] : ['build-code', 'build-publish-image'])
                .addMetaTarget('deploy', ['deploy-publish-image'])
                .addMetaTarget('deploy-raw', ['deploy-code', 'invalidate-cache'])
            ;
        }
        return t;
    }
    protected buildTerraformToVars(vars: any): TerraformToVarsTemplate {
        return new TerraformToVarsTemplate(vars);
    }
    protected getPreRequisites(): any {
        return {
        };
    }
    protected getInstallProcedures(): any {
        return {
        };
    }
    protected getTechnologies(): any {
        return [
            'react_next',
            'make',
            'aws_cli',
            'aws_cloudfront',
            'aws_s3',
            'aws_route53',
            'node',
            'es6',
            'yarn',
            'nvm',
            'npm',
            'markdown',
            'git',
            'jest',
            'prettier',
            'json',
            this.vars.publish_image && 'docker',
        ];
    }
}