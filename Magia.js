class OrbeMagico extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, flipX) {
        super(scene, x, y, 'orbe_magico');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        if (scene.magiasGroup) {
            scene.magiasGroup.add(this);
        }

        this.setScale(0.8);
        this.setDepth(6);
        this.body.setSize(100, 100);
        this.body.setAllowGravity(false);
        
        const dir = flipX ? -1 : 1;
        this.flipX = flipX;
        this.setVelocityX(800 * dir);
        
        if (this.texture.frameTotal > 1) { 
            this.setFrame(1); 
        }
        this.play('orbe_animado');
        
        scene.time.delayedCall(1500, () => {
            if (this && this.active) this.destroy();
        });
    }
}